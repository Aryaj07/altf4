import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CHECKOUT_INSIGHTS_MODULE } from "../../../../modules/checkout-insights"
import CheckoutInsightsModuleService from "../../../../modules/checkout-insights/service"

/**
 * GET /admin/checkout-insights/abandoned-carts?limit=20&offset=0&stage=payment_failed
 *
 * Open carts (not completed, with items), newest activity first, enriched
 * with customer info, failed-attempt counts, funnel stage, and whether a
 * recovery email was already sent (cart.metadata.abandoned_notification).
 * stage filter: created | checkout_started | payment_reached | payment_failed
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const insights = req.scope.resolve<CheckoutInsightsModuleService>(
      CHECKOUT_INSIGHTS_MODULE
    )

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const offset = parseInt(req.query.offset as string) || 0
    const stageFilter = req.query.stage as string | undefined

    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "currency_code",
        "total",
        "created_at",
        "updated_at",
        "metadata",
        "items.id",
        "items.title",
        "items.quantity",
        // Needed for correct totals: without unit_price/is_tax_inclusive the
        // totals decorator misprices tax-inclusive carts (adds tax on top)
        "items.unit_price",
        "items.is_tax_inclusive",
        "payment_collection.id",
        "customer.id",
        "customer.first_name",
        "customer.last_name",
      ],
      filters: { completed_at: null },
      pagination: {
        order: { updated_at: "DESC" },
        // Over-fetch window: empty carts are filtered out below, so page
        // boundaries are approximate. Good enough for a dashboard list.
        take: 500,
        skip: 0,
      },
    })

    const openCarts = carts.filter((c: any) => (c.items?.length ?? 0) > 0)

    // Failed attempts per cart for the whole window
    const cartIds = openCarts.map((c: any) => c.id)
    const failedByCart: Record<string, number> = {}
    if (cartIds.length) {
      const failedAttempts = await insights.listPaymentAttempts(
        { cart_id: cartIds, status: "failed" },
        { select: ["id", "cart_id"], take: null }
      )
      for (const a of failedAttempts) {
        if (a.cart_id) {
          failedByCart[a.cart_id] = (failedByCart[a.cart_id] ?? 0) + 1
        }
      }
    }

    const stageOf = (c: any): string => {
      if ((failedByCart[c.id] ?? 0) > 0) return "payment_failed"
      if (c.payment_collection?.id) return "payment_reached"
      if (c.email) return "checkout_started"
      return "created"
    }

    let rows = openCarts.map((c: any) => ({
      cart_id: c.id,
      email: c.email ?? null,
      customer: c.customer
        ? {
            id: c.customer.id,
            name: [c.customer.first_name, c.customer.last_name]
              .filter(Boolean)
              .join(" "),
          }
        : null,
      currency_code: c.currency_code,
      total: c.total != null ? Number(c.total) : null,
      items_count: c.items.length,
      items_preview: c.items
        .slice(0, 3)
        .map((it: any) => `${it.title} ×${it.quantity}`),
      stage: stageOf(c),
      failed_attempts: failedByCart[c.id] ?? 0,
      recovery_email: c.metadata?.abandoned_notification ?? null,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }))

    if (stageFilter) {
      rows = rows.filter((r) => r.stage === stageFilter)
    }

    res.json({
      count: rows.length,
      limit,
      offset,
      carts: rows.slice(offset, offset + limit),
    })
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Internal error" })
  }
}
