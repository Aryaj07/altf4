import { cookies } from "next/headers";
import { removeFromCart, getCart } from "lib/medusa";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { lineId } = await req.json();
    const cookieStore = await cookies();
    const cartId = cookieStore.get("cartId")?.value;

    if (!cartId) {
      return NextResponse.json(
        { error: "Missing cart ID" },
        { status: 400 }
      );
    }

    if (!lineId) {
      return NextResponse.json(
        { error: "Missing line item ID" },
        { status: 400 }
      );
    }

    await removeFromCart(cartId, lineId);

    // Fetch fresh cart data after removal
    const updatedCart = await getCart(cartId);

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (e: any) {
    console.error("Remove item error:", e);
    return NextResponse.json(
      { error: e.message || "Error removing item from cart" },
      { status: 500 }
    );
  }
}
