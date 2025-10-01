import { NextResponse } from 'next/server';


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cartId, shipping_address } = body;
    if (!cartId || !shipping_address) {
      return NextResponse.json({ error: 'Missing cartId or shipping_address' }, { status: 400 });
    }

    // Update shipping address via Medusa API
    const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API ?? 'http://localhost:9000'}/store/carts/${cartId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY ?? ''
      },
      body: JSON.stringify({ shipping_address }),
    });
    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      console.log('Error parsing JSON response:', err);
    }
    if (!res.ok || !data?.cart) {
      return NextResponse.json({ error: 'Failed to update shipping address' }, { status: 500 });
    }
    return NextResponse.json({ cart: data.cart });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
