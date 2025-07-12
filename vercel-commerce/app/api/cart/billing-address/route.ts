import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cartId, billing_address } = body;
    if (!cartId || !billing_address) {
      return NextResponse.json({ error: 'Missing cartId or billing_address' }, { status: 400 });
    }

    // Update billing address via Medusa API
    const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API ?? 'http://localhost:9000'}/store/carts/${cartId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_API_KEY ?? ''
      },
      body: JSON.stringify({ billing_address }),
    });
    let data = null;
    try {
      data = await res.json();
    } catch (err) {}
    if (!res.ok || !data?.cart) {
      return NextResponse.json({ error: 'Failed to update billing address' }, { status: 500 });
    }
    return NextResponse.json({ cart: data.cart });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
