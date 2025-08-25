import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body?.id || body?.cartId;
    const value = body?.value || body?.code;

    if (!id || !value) {
      return NextResponse.json(
        { error: "Missing cart id or promo code." },
        { status: 400 }
      );
    }

    const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY;

    if (!publishableKey) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY." },
        { status: 500 }
      );
    }

    const applyRes = await fetch(
      `${backendUrl}/store/carts/${id}/promotions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": publishableKey,
        },
        body: JSON.stringify({
          promo_codes: [value],
        }),
      }
    );

    const text = await applyRes.text();
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: applyRes.status });
    } catch {
      return NextResponse.json({ message: text }, { status: applyRes.status });
    }
  } catch (error) {
    console.error("Error applying promotion:", error);
    return NextResponse.json(
      { error: "Failed to apply promotion" },
      { status: 500 }
    );
  }
}