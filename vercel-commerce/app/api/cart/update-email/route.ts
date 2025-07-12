import { NextResponse } from "next/server";
import medusaRequest from "lib/medusa";

// POST /api/cart/update-email to update cart email
export async function POST(req: Request) {
  try {
    const { cartId, email } = await req.json();
    if (!cartId || !email) {
      return NextResponse.json({ error: "Missing cartId or email" }, { status: 400 });
    }
    // Medusa API: POST /store/carts/{id} with { email }
    const res = await medusaRequest({
      method: 'POST',
      path: `/carts/${cartId}`,
      payload: { email },
      tags: ['cart']
    });
    return NextResponse.json({ cart: res.body.cart });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update cart email" }, { status: 500 });
  }
}
