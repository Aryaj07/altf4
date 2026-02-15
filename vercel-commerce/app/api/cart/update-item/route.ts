import { cookies } from "next/headers";
import { updateCart, getCart } from "lib/medusa";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { lineId, quantity } = await req.json();

  const cookieStore = await cookies();
  const cartId = cookieStore.get("cartId")?.value;

  if (!cartId) {
    return NextResponse.json(
      { error: "Missing cart ID" },
      { status: 400 }
    );
  }

  try {
    await updateCart(cartId, {
      lineItemId: lineId,
      quantity,
    });

    // Fetch fresh cart data after update
    const updatedCart = await getCart(cartId);

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Error updating item quantity" },
      { status: 500 }
    );
  }
}
