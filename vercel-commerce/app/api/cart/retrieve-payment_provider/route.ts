import { NextRequest, NextResponse } from "next/server";

const medusaBackendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API || "http://localhost:9000";

// GET /api/cart/retrieve-payment_provider?region_id=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region_id = searchParams.get("region_id");

  if (!region_id) {
    return NextResponse.json(
      { error: "Missing region_id" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${medusaBackendUrl}/store/payment-providers?region_id=${region_id}`,
      {
        headers: {
          "x-publishable-api-key":
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || "",
        },
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

    // Only include enabled providers
    const filtered = (data.payment_providers || []).filter(
      (p: any) => p.is_enabled
    );

    // Make sure we’re sending just the ids
    const mapped = filtered.map((p: any) => ({
      id: p.id,
      is_enabled: p.is_enabled,
      label: p.id === "razorpay" ? "Razorpay" : p.id, // optional: friendly names
    }));

    return NextResponse.json({ payment_providers: mapped });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch payment providers",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
