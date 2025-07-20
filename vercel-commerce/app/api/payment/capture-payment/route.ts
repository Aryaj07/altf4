import { NextRequest, NextResponse } from "next/server";
import Medusa from "@medusajs/js-sdk";

// Define the admin SDK instance here with your admin credentials
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API;

if (!MEDUSA_BACKEND_URL) {
  throw new Error("❌ NEXT_PUBLIC_MEDUSA_BACKEND_API is not defined");
}

const sdkServer = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL, // e.g. "http://localhost:9000"
  apiKey: process.env.MEDUSA_ADMIN_API_KEY, // must be set in your .env file
});

// POST /api/cart/capture-payment
export async function POST(req: NextRequest) {
  try {
    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
    }

    const { payment } = await sdkServer.admin.payment.capture(paymentId, {});

    return NextResponse.json({ payment });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to capture payment" },
      { status: 500 }
    );
  }
}