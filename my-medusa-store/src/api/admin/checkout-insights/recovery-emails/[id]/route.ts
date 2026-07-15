import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { CHECKOUT_INSIGHTS_MODULE } from "../../../../../modules/checkout-insights"
import CheckoutInsightsModuleService from "../../../../../modules/checkout-insights/service"

/**
 * GET /admin/checkout-insights/recovery-emails/:id
 * Single recovery-email record including the rendered HTML for preview.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const insights = req.scope.resolve<CheckoutInsightsModuleService>(
      CHECKOUT_INSIGHTS_MODULE
    )
    const email = await insights.retrieveRecoveryEmail(req.params.id)
    res.json({ recovery_email: email })
  } catch (e: any) {
    res.status(404).json({ message: `Recovery email ${req.params.id} not found` })
  }
}
