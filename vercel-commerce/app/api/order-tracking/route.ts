import { NextResponse } from "next/server";
import { sdkServeradmin } from "lib/sdk/sdk-server-admin";

/**
 * GET /api/order-tracking?order_id=order_xxx
 * 
 * Fetches fulfillment and tracking details for a specific order
 * using the admin SDK (which has access to fulfillment data).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json(
      { error: "order_id is required" },
      { status: 400 }
    );
  }

  try {
    const { order } = await sdkServeradmin.admin.order.retrieve(orderId, {
      fields:
        "+fulfillments.*,+fulfillments.labels.*,+fulfillments.items.*",
    });

    // Extract tracking info from fulfillments
    const fulfillments = (order as any)?.fulfillments || [];

    const trackingDetails = fulfillments.map((fulfillment: any) => {
      const labels = fulfillment.labels || [];

      // Each label can have tracking_number, tracking_url, label_url
      const trackingNumbers = labels
        .filter((label: any) => label.tracking_number)
        .map((label: any) => ({
          tracking_number: label.tracking_number,
          tracking_url: label.tracking_url || null,
          label_url: label.label_url || null,
        }));

      return {
        fulfillment_id: fulfillment.id,
        status: fulfillment.delivered_at
          ? "delivered"
          : fulfillment.shipped_at
            ? "shipped"
            : fulfillment.packed_at
              ? "packed"
              : "processing",
        packed_at: fulfillment.packed_at || null,
        shipped_at: fulfillment.shipped_at || null,
        delivered_at: fulfillment.delivered_at || null,
        created_at: fulfillment.created_at || null,
        tracking: trackingNumbers,
        items: (fulfillment.items || []).map((item: any) => ({
          title: item.title,
          sku: item.sku,
          quantity: item.quantity,
        })),
      };
    });

    return NextResponse.json(
      {
        order_id: orderId,
        fulfillment_status: (order as any)?.fulfillment_status || "not_fulfilled",
        fulfillments: trackingDetails,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Error fetching order tracking:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tracking details",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
