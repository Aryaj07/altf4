import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { cart_id } = await req.json();

    if (!cart_id) {
      return NextResponse.json(
        { error: "Missing cart_id" },
        { status: 400 }
      );
    }

    const medusaUrl = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API}/store/carts/${cart_id}/complete`;

    const medusaRes = await fetch(medusaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key":
          process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || "",
      },
    });

    const data = await medusaRes.json();

    if (!medusaRes.ok) {
      console.error("Medusa complete cart error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to complete cart" },
        { status: medusaRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      ...data,   // send back the entire order object directly
    });
  } catch (e) {
    console.error("Cart completion failed:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
