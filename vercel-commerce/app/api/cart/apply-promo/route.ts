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

    // Step 1 - Try applying the promo code
    const applyRes = await fetch(
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

    if (!applyRes.ok) {
      const errorText = await applyRes.text();
      return NextResponse.json(
        {
          error: applyRes.statusText,
          details: errorText,
        },
        { status: applyRes.status }
      );
    }

    // Step 2 - Fetch the updated cart
    const cartRes = await fetch(
      `${medusaBackendUrl}/store/carts/${cartId}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY && {
            "x-publishable-api-key":
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY,
          }),
        },
      }
    );

    if (!cartRes.ok) {
      return NextResponse.json(
        { error: "Failed to retrieve cart after applying promotion." },
        { status: 500 }
      );
    }

    const cartData = await cartRes.json();

    // ✅ Check whether promo code is active
    const promoFound = cartData.cart.promo_codes?.some(
      (p: any) => p.code?.toLowerCase() === code.toLowerCase()
    );

    const discountApplied = cartData.cart.discounts?.some(
      (d: any) =>
        d.rule?.type !== "free_shipping" &&
        d.rule?.code?.toLowerCase() === code.toLowerCase()
    );

    if (!promoFound || !discountApplied) {
      return NextResponse.json(
        {
          error: `Promotion code "${code}" is invalid or not applicable.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Promotion "${code}" applied successfully.`,
      discount: discountApplied,
    });
  } catch (error) {
    console.error("Error applying promotion:", error);
    return NextResponse.json(
      { error: "Failed to apply promotion", details: error },
      { status: 500 }
    );
  }
}
