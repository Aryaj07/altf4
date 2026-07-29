import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { CHECKOUT_INSIGHTS_MODULE } from "../../../../modules/checkout-insights"
import CheckoutInsightsModuleService from "../../../../modules/checkout-insights/service"

/**
 * GET /admin/order-updates/history?limit=50&offset=0
 *
 * Recent order-update emails, newest first, one row per recipient — the
 * admin page groups these client-side by batch_id into "Recent sends".
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const insights = req.scope.resolve<CheckoutInsightsModuleService>(
      CHECKOUT_INSIGHTS_MODULE
    )

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0

    const [rows, count] = await insights.listAndCountOrderUpdateEmails(
      {},
      {
        select: [
          "id",
          "order_id",
          "order_display_id",
          "email",
          "subject",
          "batch_id",
          "created_at",
        ],
        order: { created_at: "DESC" },
        take: limit,
        skip: offset,
      }
    )

    res.json({ count, limit, offset, order_update_emails: rows })
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Internal error" })
  }
}
