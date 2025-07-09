import { cookies } from "next/headers";
import { addToCart, createCart, getCart } from "lib/medusa";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { variantId } = await req.json();

  let cartId = cookies().get("cartId")?.value;
  let cart;

  if (cartId) {
    cart = await getCart(cartId);
  }

  if (!cartId || !cart) {
    cart = await createCart();
    cartId = cart.id!;
    cookies().set("cartId", cartId);
  }

  if (!variantId) {
    return NextResponse.json(
      { error: "Missing product variant ID" },
      { status: 400 }
    );
  }

  try {
    await addToCart(cartId, { variantId, quantity: 1 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Error adding item to cart" },
      { status: 500 }
    );
  }
}
