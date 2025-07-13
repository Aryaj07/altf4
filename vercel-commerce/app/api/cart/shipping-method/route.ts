import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { cartId, option_id } = body;

    if (!cartId || !option_id) {
      return NextResponse.json(
        { error: "cartId and option_id are required." },
        { status: 400 }
      );
    }

    const medusaUrl =
      process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";

    const res = await fetch(
      `${medusaUrl}/store/carts/${cartId}/shipping-methods`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY && {
            "x-publishable-api-key":
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY,
          }),
        },
        body: JSON.stringify({
          option_id,
        }),
      }
    );

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
      cart: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to save shipping method to cart.",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
