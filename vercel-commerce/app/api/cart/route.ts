import { cookies } from "next/headers";
import { createCart, getCart } from "lib/medusa";
import { NextResponse } from "next/server";
import { sdkServer } from "@/lib/sdk/sdk-server";

export async function GET() {
  const cookieStore = await cookies();

  // Get cartId from cookies
  const cartId = cookieStore.get("cartId")?.value;
  let cart = null;

  // If we have a cartId, try to retrieve the existing cart
  if (cartId) {
    try {
      cart = await getCart(cartId);
      console.log("Existing cart retrieved:", cart?.id);
    } catch (err) {
      console.log("Failed to retrieve cart, will create new one:", String(err));
      // If cart retrieval fails, clear the invalid cookie
      cookieStore.delete("cartId");
    }
  }

  // Only create a new cart if we don't have a valid existing one
  if (!cart) {
    console.log("Creating new cart...");
    cart = await createCart();
    
    // Attempt to read the current customer. For anonymous requests this
    // may throw (401) — guard it so we still can create a cart for
    // first-time visitors.
    let cust = null;
    try {
      cust = await sdkServer.store.customer.retrieve();
      console.log("Customer retrieved:", !!cust?.customer?.id);
    } catch (err) {
      console.log('No authenticated customer or error retrieving customer:', String(err));
      cust = null;
    }

    if (!cart?.id) {
      return NextResponse.json(
        { error: "Cart ID is undefined." },
        { status: 500 }
      );
    }

    // If customer is logged in, transfer the cart to the customer
    if (cust?.customer?.id) {
      try {
        const res = await sdkServer.store.cart.transferCart(cart?.id);
        console.log("Cart transferred successfully", res?.cart?.customer_id);
      } catch (err) {
        console.log('Failed to transfer cart to customer:', String(err));
      }
    }

    // Set cartId in cookies with proper expiration
    if (cart?.id) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
      
      cookieStore.set("cartId", cart.id ?? "", {
        expires: expiryDate,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      
      console.log("New cart created and cookie set:", cart.id, "expires:", expiryDate);
    } else {
      return NextResponse.json(
        { error: "Failed to create a new cart." },
        { status: 500 }
      );
    }
  } else {
    // Refresh the existing cart cookie expiration
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Extend by another 30 days
    
    cookieStore.set("cartId", cart.id ?? "", {
      expires: expiryDate,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    console.log("Existing cart cookie refreshed:", cart.id, "new expiry:", expiryDate);
  }

  if (!cart.region) {
    return NextResponse.json(
      { error: "Cart is missing region info" },
      { status: 500 }
    );
  }

  return NextResponse.json(cart);
}