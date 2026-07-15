import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { CHECKOUT_INSIGHTS_MODULE } from "../../../../modules/checkout-insights"
import CheckoutInsightsModuleService from "../../../../modules/checkout-insights/service"

/**
 * GET /admin/checkout-insights/recovery-emails?limit=20&offset=0&cart_id=...
 *
 * Sent recovery emails, newest first, without the HTML body (fetch a single
 * record via /recovery-emails/:id for the full preview).
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const insights = req.scope.resolve<CheckoutInsightsModuleService>(
      CHECKOUT_INSIGHTS_MODULE
    )

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const offset = parseInt(req.query.offset as string) || 0
    const cartId = req.query.cart_id as string | undefined

    const [emails, count] = await insights.listAndCountRecoveryEmails(
      cartId ? { cart_id: cartId } : {},
      {
        select: [
          "id",
          "cart_id",
          "customer_id",
          "email",
          "subject",
          "items",
          "total_formatted",
          "manual",
          "created_at",
        ],
        order: { created_at: "DESC" },
        take: limit,
        skip: offset,
      }
    )

    res.json({ count, limit, offset, recovery_emails: emails })
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Internal error" })
  }
}
