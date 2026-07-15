import { cookies } from "next/headers";
import { addToCart, createCart, getCart } from "lib/medusa";
import { NextResponse } from "next/server";
import { sdkServer } from "@/lib/sdk/sdk-server";

export async function POST(req: Request) {
  const { variantId } = await req.json();

  const cookieStore = await cookies();
  let cartId = cookieStore.get("cartId")?.value;
  let cart;

  if (cartId) {
    cart = await getCart(cartId);
  }

  if (!cartId || !cart) {
    cart = await createCart();
    cartId = cart?.id!;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    cookieStore.set("cartId", cartId, {
      expires: expiryDate,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // If the customer is logged in, attach the new cart to them right away
    // (carts are only created here now, so this replaces the transfer that
    // used to happen in GET /api/cart).
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
      try {
        await sdkServer.store.cart.transferCart(cartId, undefined, {
          Authorization: `Bearer ${token}`,
        });
        console.log("New cart transferred to logged-in customer:", cartId);
      } catch (err) {
        console.log("Failed to transfer new cart to customer:", String(err));
      }
    }
  }

  if (!variantId) {
    return NextResponse.json(
      { error: "Missing product variant ID" },
      { status: 400 }
    );
  }

  try {
    await addToCart(cartId!, { 
      variantId, 
      quantity: 1
    });

    // Fetch the updated cart to return fresh data
    const updatedCart = await getCart(cartId!);

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (e: any) {
    console.error(e);
    
    let errorMessage = "Error adding item to cart";
    if (e?.message) {
      if (e.message.includes("must either contain only preorder variants")) {
        errorMessage = "Cannot mix preorder and regular items in cart. Please checkout separately.";
      } else if (e.message.includes("insufficient_inventory")) {
        errorMessage = "This item is out of stock.";
      } else {
        errorMessage = e.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
