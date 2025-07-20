import { NextRequest, NextResponse } from "next/server";
import Medusa from "@medusajs/js-sdk";

// Initialize the admin SDK with environment variables
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API;

if (!MEDUSA_BACKEND_URL) {
  throw new Error("❌ NEXT_PUBLIC_MEDUSA_BACKEND_API is not defined");
}

const sdkServer = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL, // e.g. "http://localhost:9000"
  apiKey: process.env.MEDUSA_ADMIN_API_KEY, // must be set in your .env file
});

// GET /api/payment/retrieve-payment?paymentId=pay_123
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
    }

    const { payment } = await sdkServer.admin.payment.retrieve(paymentId);

    return NextResponse.json({ payment });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve payment" },
      { status: 500 }
    );
  }
}