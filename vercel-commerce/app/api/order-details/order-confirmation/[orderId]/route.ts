// /app/api/order-details/order-confirmation/[orderId]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  if (!orderId) {
    return NextResponse.json(
      { error: "Missing orderId" },
      { status: 400 }
    );
  }

  const MEDUSA_BACKEND_URL =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

  const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

  try {
    const url = `${MEDUSA_BACKEND_URL}/store/orders/${orderId}`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY
          ? { "x-publishable-api-key": API_KEY }
          : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Error fetching order:", await res.text());
      return NextResponse.json(
        { error: "Order not found or Medusa error" },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data.order);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error?.message || "Order fetch failed." },
      { status: 500 }
    );
  }
}
