import { NextResponse } from "next/server"
import { sdkServeradmin } from "lib/sdk/sdk-server-admin"


export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get("order_id")

    if (!orderId) {
        return NextResponse.json(
            { error: "Order ID is required." },
            { status: 400 }
        )
    }
    try {
        const { order } = await sdkServeradmin.admin.order.retrieve(orderId, {
            fields: "*transactions",
        })

        const paymentId = order.payment_collections?.[0]?.payments?.[0]?.id

        return NextResponse.json({
            order,
            paymentId,
        })
    } catch (error: any) {
        console.error("Error fetching order:", error)
        return NextResponse.json(
            {
                error: "Failed to retrieve order.",
                details: error.message,
            },
            { status: 500 }
        )
    }
}