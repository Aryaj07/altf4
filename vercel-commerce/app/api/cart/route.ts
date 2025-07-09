import { cookies } from "next/headers";
import { createCart, getCart } from "lib/medusa";
import { NextResponse } from "next/server";

export async function GET() {
  let cartId = cookies().get("cartId")?.value;
  let cart;

  if (cartId) {
    cart = await getCart(cartId);
  }
  
  if (!cartId || !cart) {
    cart = await createCart();
    cookies().set("cartId", cart.id!);
}

  if (!cartId || !cart) {
    cart = await createCart();
    cookies().set("cartId", cart.id!);
  }

//console.log("CART: " , cart?.lines?.[0]);

  // ✅ Ensure cart always has region, etc.
  if (!cart.region) {
    return NextResponse.json(
      { error: "Cart is missing region info" },
      { status: 500 }
    );
  }

  return NextResponse.json(cart);
}
