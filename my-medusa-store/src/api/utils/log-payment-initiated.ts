import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CHECKOUT_INSIGHTS_MODULE } from "../../modules/checkout-insights"
import CheckoutInsightsModuleService from "../../modules/checkout-insights/service"
import { PaymentAttemptStatus } from "../../modules/checkout-insights/models/payment-attempt"
import { resolveCartFromPaymentCollection } from "./checkout-insights"

/**
 * Taps POST /store/payment-collections/:id/payment-sessions and logs an
 * "initiated" payment attempt once the session was created successfully.
 * Fire-and-forget: logging failures must never affect checkout.
 */
export function logPaymentInitiated(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const paymentCollectionId = req.params.id

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return
    }

    void (async () => {
      const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
      try {
        const cartInfo = await resolveCartFromPaymentCollection(
          req.scope,
          paymentCollectionId
        )
        const insights = req.scope.resolve<CheckoutInsightsModuleService>(
          CHECKOUT_INSIGHTS_MODULE
        )
        await insights.logAttempt({
          cart_id: cartInfo.cart_id,
          customer_id: cartInfo.customer_id,
          email: cartInfo.email,
          currency_code: cartInfo.currency_code,
          provider_id:
            (req.body as any)?.provider_id ?? "razorpay",
          status: PaymentAttemptStatus.INITIATED,
        })
      } catch (e: any) {
        logger.warn(
          `checkout-insights: failed to log initiated attempt for collection ${paymentCollectionId} -> ${e?.message}`
        )
      }
    })()
  })

  next()
}
