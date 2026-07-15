import { cookies } from "next/headers";
import { getCart } from "lib/medusa";
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
      console.log("Failed to retrieve cart, clearing cookie:", String(err));
      // If cart retrieval fails, clear the invalid cookie
      cookieStore.delete("cartId");
    }
  }

  // If the cart belongs to a customer, make sure it belongs to the customer
  // of THIS session. A leftover cookie from a previous user on the same
  // browser must not expose (or later hijack) their cart.
  if (cart?.customer_id) {
    const token = cookieStore.get("auth_token")?.value;
    let owned = false;
    if (token) {
      try {
        const { customer } = await sdkServer.store.customer.retrieve(
          {},
          { Authorization: `Bearer ${token}` }
        );
        owned =
          customer.id === cart.customer_id ||
          (!!cart.email && cart.email === customer.email);
      } catch {
        owned = false;
      }
      if (!owned) {
        console.log("Cart belongs to a different customer, clearing cookie:", cart.id);
        cookieStore.delete("cartId");
        cart = null;
      }
    }
    // No token: guest checkout sets a guest-customer on the cart once an
    // email is entered, so an anonymous session with a customer-linked cart
    // is normal — leave it. Logout clears the cookie for real customers.
  }

  // No valid cart: do NOT create one here. Carts are created lazily by
  // /api/cart/add-item on the first add-to-cart. Creating them on GET meant
  // every cookie-less visit (incl. bots/crawlers) produced an empty cart in
  // the backend.
  if (!cart) {
    return NextResponse.json(null, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
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

  return NextResponse.json(cart, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}