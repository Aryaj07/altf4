import { NextRequest, NextResponse } from "next/server";

// Razorpay's callback_url target.
//
// For redirect-based payment methods (UPI intent, netbanking, some mobile
// browsers) Razorpay does a cross-site form POST to the callback URL. A POST
// straight to the /payment-return *page* is rejected by Next.js (it is treated
// as a Server Action from a foreign origin), which is what customers saw as a
// crash/"CORS" error after paying. This route accepts the POST and forwards
// the fields to /payment-return as query params with a 303 (GET) redirect.
// The GET is a top-level navigation, so the SameSite=Lax cart/auth cookies are
// sent again.

const FORWARDED_FIELDS = [
  "razorpay_payment_id",
  "razorpay_order_id",
  "razorpay_signature",
  "error[code]",
  "error[description]",
  "error[reason]",
  "error[metadata]",
];

function redirectToReturnPage(req: NextRequest, source: URLSearchParams | FormData) {
  const target = new URL("/payment-return", req.url);
  for (const field of FORWARDED_FIELDS) {
    const value = source.get(field);
    if (typeof value === "string" && value) target.searchParams.set(field, value);
  }
  return NextResponse.redirect(target, 303);
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    form = new FormData();
  }
  return redirectToReturnPage(req, form);
}

export async function GET(req: NextRequest) {
  return redirectToReturnPage(req, req.nextUrl.searchParams);
}
