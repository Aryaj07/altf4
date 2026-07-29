import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/order-updates/orders?q=&preorder_only=true&limit=20&offset=0
 *
 * Order picker list for the bulk "Order Updates" email page. Defaults to
 * orders with at least one pending preorder (the typical "delayed preorder"
 * case) — pass preorder_only=false to search all orders instead.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const offset = parseInt(req.query.offset as string) || 0
    const q = (req.query.q as string | undefined)?.trim()
    const preorderOnly = req.query.preorder_only !== "false"

    const filters: any = {}

    if (preorderOnly) {
      const { data: preorders } = await query.graph({
        entity: "preorder",
        fields: ["order_id"],
        filters: { status: "pending" },
      })
      const orderIds = [...new Set(preorders.map((p: any) => p.order_id))]
      if (!orderIds.length) {
        res.json({ count: 0, limit, offset, orders: [] })
        return
      }
      filters.id = orderIds
    }

    if (q) {
      const asNumber = Number(q)
      const orConditions: any[] = [{ email: { $ilike: `%${q}%` } }]
      if (!Number.isNaN(asNumber)) {
        orConditions.push({ display_id: asNumber })
      }
      filters.$or = orConditions
    }

    const { data: orders, metadata } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "customer.first_name",
        "customer.last_name",
        "status",
        "created_at",
        "items.title",
      ],
      filters,
      pagination: {
        take: limit,
        skip: offset,
        order: { created_at: "DESC" },
      },
    })

    // "fulfillment_status" isn't a plain queryable field on the order entity
    // via query.graph in this Medusa version (it's computed only by the core
    // admin order REST handlers) — so we surface preorder status instead,
    // which is what actually matters for this "delayed preorder" workflow.
    const orderIds = orders.map((o: any) => o.id)
    const preorderStatusByOrder = new Map<string, string>()
    if (orderIds.length) {
      const { data: preorders } = await query.graph({
        entity: "preorder",
        fields: ["order_id", "status"],
        filters: { order_id: orderIds },
      })
      for (const p of preorders as any[]) {
        // Pending takes priority so a partially-fulfilled order still shows
        // as needing attention.
        if (
          !preorderStatusByOrder.has(p.order_id) ||
          p.status === "pending"
        ) {
          preorderStatusByOrder.set(p.order_id, p.status)
        }
      }
    }

    res.json({
      count: metadata?.count ?? orders.length,
      limit,
      offset,
      orders: orders.map((o: any) => ({
        id: o.id,
        display_id: o.display_id,
        email: o.email,
        customer_name:
          [o.customer?.first_name, o.customer?.last_name]
            .filter(Boolean)
            .join(" ") || null,
        status: o.status,
        preorder_status: preorderStatusByOrder.get(o.id) ?? null,
        created_at: o.created_at,
        items_preview: (o.items ?? []).slice(0, 3).map((it: any) => it.title),
        items_count: (o.items ?? []).length,
      })),
    })
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Internal error" })
  }
}
