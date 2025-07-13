import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { payment_collection_id, payment_session_id } = body

    if (!payment_collection_id || !payment_session_id) {
      return NextResponse.json(
        { error: "Missing payment_collection_id or payment_session_id" },
        { status: 400 }
      )
    }

    const medusaBackendUrl =
      process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

    const url = `${medusaBackendUrl}/store/payment-collections/${payment_collection_id}/payment-sessions/${payment_session_id}/initiate`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY && {
          "x-publishable-api-key":
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY,
        }),
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json(
        { error: res.statusText, details: errorText },
        { status: res.status }
      )
    }

    const data = await res.json()

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to initiate payment session", details: err?.message },
      { status: 500 }
    )
  }
}
