import { cookies } from "next/headers";
import { createCart, getCart } from "lib/medusa";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = cookies();

  const cartId = cookieStore.get("cartId")?.value;
  let cart = null;

  if (cartId) {
    cart = await getCart(cartId);
  }

  if (!cart) {
    cart = await createCart();
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
