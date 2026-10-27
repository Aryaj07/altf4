import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sdkServer } from "lib/sdk/sdk-server";

/**
 * GET /api/order-tracking?order_id=order_xxx
 *
 * Fetches fulfillment and tracking details for one of the logged-in
 * customer's orders. The store order list only returns orders that belong
 * to the customer of the auth_token cookie, so other orders aren't found.
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

  const cookieStore = await cookies();
  if (!cookieStore.get("auth_token")?.value) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { orders } = await sdkServer.store.order.list({
      id: orderId,
      fields:
        "+fulfillment_status,+*fulfillments,+*fulfillments.labels,+*fulfillments.items",
    });
    const order = orders[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Extract tracking info from fulfillments
    const fulfillments = (order as any)?.fulfillments || [];

    const trackingDetails = fulfillments.map((fulfillment: any) => {
      const labels = fulfillment.labels || [];

      // Only the AWB number and courier tracking link are shown to the
      // customer; label_url (the shipping label) stays internal.
      const trackingNumbers = labels
        .filter((label: any) => label.tracking_number)
        .map((label: any) => ({
          tracking_number: label.tracking_number,
          tracking_url: label.tracking_url || null,
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
      { error: "Failed to fetch tracking details" },
      { status: 500 }
    );
  }
}
