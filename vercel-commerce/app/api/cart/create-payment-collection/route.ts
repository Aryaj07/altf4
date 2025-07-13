import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { cartId } = body;

    if (!cartId) {
      return NextResponse.json(
        { error: "Missing cartId" },
        { status: 400 }
      );
    }

    const medusaBackendUrl =
      process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";

    const res = await fetch(
      `${medusaBackendUrl}/store/payment-collections`,
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
          cart_id: cartId,
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: res.statusText, details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      payment_collection: data.payment_collection,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create payment collection", details: err?.message },
      { status: 500 }
    );
  }
}
