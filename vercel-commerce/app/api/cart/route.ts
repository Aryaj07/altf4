import { cookies } from "next/headers";
import { createCart, getCart } from "lib/medusa";
import { NextResponse } from "next/server";
import { sdkServer } from "@/lib/sdk/sdk-server";

export async function GET() {
  const cookieStore = await cookies();

  // Get cartId from cookies
  const cartId = cookieStore.get("cartId")?.value;
  let cart = null;

  if (cartId) {
    cart = await getCart(cartId);
  }

  if (!cart) {
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
    // Set cartId in cookies
    if (cart?.id) {
      cookieStore.set("cartId", cart.id);
    } else {
      return NextResponse.json(
        { error: "Failed to create a new cart." },
        { status: 500 }
      );
    }
  }

  if (!cart.region) {
    return NextResponse.json(
      { error: "Cart is missing region info" },
      { status: 500 }
    );
  }

  return NextResponse.json(cart);
}