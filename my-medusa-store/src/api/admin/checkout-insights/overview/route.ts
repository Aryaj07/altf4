import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CHECKOUT_INSIGHTS_MODULE } from "../../../../modules/checkout-insights"
import CheckoutInsightsModuleService from "../../../../modules/checkout-insights/service"

/**
 * GET /admin/checkout-insights/overview?from=2026-07-01&to=2026-07-15
 *
 * Checkout funnel + payment attempt KPIs for the date range (defaults to
 * the last 30 days). Funnel stages, per the design doc:
 *   created -> checkout_started (email set) -> payment_reached
 *   -> completed; plus failed-attempt breakdowns from the attempt log.
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

    const to = req.query.to
      ? new Date(`${req.query.to}T23:59:59.999Z`)
      : new Date()
    const from = req.query.from
      ? new Date(`${req.query.from}T00:00:00.000Z`)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

    const dateFilter = {
      $gte: from.toISOString(),
      $lte: to.toISOString(),
    }

    // Carts in range — funnel computed in memory; fine at current store
    // volume, revisit with SQL aggregation if cart counts grow large.
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "completed_at",
        "created_at",
        "items.id",
        "payment_collection.id",
      ],
      filters: { created_at: dateFilter },
    })

    const withItems = carts.filter((c: any) => (c.items?.length ?? 0) > 0)
    const created = withItems.length
    const checkoutStarted = withItems.filter((c: any) => !!c.email).length
    const paymentReached = withItems.filter(
      (c: any) => !!c.payment_collection?.id
    ).length
    const completed = withItems.filter((c: any) => !!c.completed_at).length

    // Attempt log in range
    const attempts = await insights.listPaymentAttempts(
      { created_at: dateFilter },
      { take: null }
    )

    const byStatus: Record<string, number> = {}
    const failureReasons: Record<string, number> = {}
    const failedCartsNoOrder = new Set<string>()
    const failedThenRecovered = new Set<string>()

    for (const a of attempts) {
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1
      if (a.status === "failed") {
        const reason = a.failure_reason ?? "unknown"
        failureReasons[reason] = (failureReasons[reason] ?? 0) + 1
        if (a.cart_id) {
          if (a.order_id) {
            failedThenRecovered.add(a.cart_id)
          } else {
            failedCartsNoOrder.add(a.cart_id)
          }
        }
      }
    }

    const pct = (part: number, whole: number) =>
      whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0

    res.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      funnel: {
        created,
        checkout_started: checkoutStarted,
        payment_reached: paymentReached,
        completed,
      },
      rates: {
        checkout_start_rate: pct(checkoutStarted, created),
        payment_reach_rate: pct(paymentReached, checkoutStarted),
        completion_rate: pct(completed, checkoutStarted),
        abandonment_rate: pct(checkoutStarted - completed, checkoutStarted),
      },
      attempts: {
        by_status: byStatus,
        total: attempts.length,
        carts_with_failed_no_order: failedCartsNoOrder.size,
        carts_failed_then_recovered: failedThenRecovered.size,
        failure_reasons: Object.entries(failureReasons)
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count),
      },
    })
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Internal error" })
  }
}
