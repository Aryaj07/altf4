import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const cartId = url.searchParams.get("cartId");

    if (!cartId) {
      return NextResponse.json(
        { error: "Missing cartId in query parameters." },
        { status: 400 }
      );
    }


    // Parse the request body for promo_codes
    const body = await req.json().catch(() => null);
    let promo_codes = body?.promo_codes;

    // If promo_codes is missing or empty, fetch the cart and extract all applied promo codes
    if (!Array.isArray(promo_codes) || promo_codes.length === 0) {
      // Fetch the cart to get applied promotions
      const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API;
      const cartRes = await fetch(
        `${medusaUrl}/store/carts/${cartId}`,
        {
          headers: {
            ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY && {
              "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY,
            }),
          },
        }
      );
      if (!cartRes.ok) {
        return NextResponse.json(
          { error: "Failed to fetch cart to determine applied promotions." },
          { status: 500 }
        );
      }
      const cartData = await cartRes.json();
      const promotions = cartData?.cart?.promotions || [];
      promo_codes = promotions.map((promo: any) => promo.code).filter(Boolean);
      if (!Array.isArray(promo_codes) || promo_codes.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No promo codes were applied to the cart.",
        });
      }
    }

    const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API;

    const res = await fetch(
      `${medusaUrl}/store/carts/${cartId}/promotions`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY && {
            "x-publishable-api-key":
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY,
          }),
        },
        body: JSON.stringify({ promo_codes }),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json(
        {
          error: data?.message || "Failed to remove promotions from cart.",
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Promotions removed successfully.",
    });
  } catch (error: any) {
    console.error("Error removing promotions:", error);
    return NextResponse.json(
      {
        error: "Unexpected error while removing promotions.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
