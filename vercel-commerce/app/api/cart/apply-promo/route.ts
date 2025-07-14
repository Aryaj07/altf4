import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cartId, code } = body;

    if (!cartId || !code) {
      return NextResponse.json(
        { error: "Missing cartId or promotion code" },
        { status: 400 }
      );
    }

    const medusaBackendUrl =
      process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";

    const res = await fetch(
      `${medusaBackendUrl}/store/carts/${cartId}/promotions`,
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
          promo_codes: [code],
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

    // ✅ No need to return the full cart
    return NextResponse.json({
      success: true,
      message: "Promotion applied successfully",
    });
  } catch (err: any) {
    console.error("Error applying promotion:", err);
    return NextResponse.json(
      { error: "Failed to apply promotion", details: err?.message },
      { status: 500 }
    );
  }
}
