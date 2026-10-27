import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sdkServer } from "lib/sdk/sdk-server";

// Returns one of the logged-in customer's orders for the confirmation pages.
// The store order list only contains orders of the auth_token cookie's
// customer, so an order id alone is not enough to read someone's order.
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { error: "Missing orderId" },
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
        "+*items,+*items.variant,+*items.variant.preorder_variant,+*shipping_address,+subtotal,+shipping_total,+tax_total,+email",
    });
    const order = orders[0];

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: any) {
    console.error("Order fetch failed:", error?.name || "Unknown error");
    return NextResponse.json(
      { error: "Order fetch failed." },
      { status: 500 }
    );
  }
}
