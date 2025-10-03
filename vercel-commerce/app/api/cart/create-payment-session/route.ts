import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { payment_collection_id, provider_id } = body;

    if (!payment_collection_id || !provider_id) {
      return NextResponse.json(
        { error: "Missing payment_collection_id or provider_id" },
        { status: 400 }
      );
    }

    const medusaBackendUrl =
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API;

    const res = await fetch(
      `${medusaBackendUrl}/store/payment-collections/${payment_collection_id}/payment-sessions`,
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
          provider_id,
          data: {}, // optional provider-specific data
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

    const paymentSession =
      data?.payment_collection?.payment_sessions?.[0] || null;

    if (!paymentSession) {
      return NextResponse.json(
        {
          error:
            "Payment session was created on backend but no session was returned.",
          details: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payment_session: paymentSession,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create payment session", details: err?.message },
      { status: 500 }
    );
  }
}
