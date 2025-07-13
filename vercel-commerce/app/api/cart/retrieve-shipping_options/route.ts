import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cartId = searchParams.get('cart_id');

  if (!cartId) {
    return NextResponse.json(
      { error: 'Missing cart_id' },
      { status: 400 }
    );
  }

  try {
    const medusaUrl =
      process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

    // Build query string
    const params = new URLSearchParams();
    params.set('cart_id', cartId);

    const medusaEndpoint = `${medusaUrl}/store/shipping-options?${params.toString()}`;

    const res = await fetch(medusaEndpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY && {
          'x-publishable-api-key':
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY,
        }),
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        {
          error: res.statusText,
          details: errorText,
        },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      shipping_options: data.shipping_options,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch shipping options',
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
