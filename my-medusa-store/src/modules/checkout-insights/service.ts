import { MedusaService } from "@medusajs/framework/utils"
import { PaymentAttempt, PaymentAttemptStatus } from "./models/payment-attempt"
import { RecoveryEmail } from "./models/recovery-email"

type LogAttemptInput = {
  cart_id?: string | null
  status: PaymentAttemptStatus
  customer_id?: string | null
  email?: string | null
  provider_id?: string
  amount?: number | null
  currency_code?: string | null
  failure_code?: string | null
  failure_reason?: string | null
  external_payment_id?: string | null
  raw_payload?: Record<string, unknown> | null
}

export default class CheckoutInsightsModuleService extends MedusaService({
  PaymentAttempt,
  RecoveryEmail,
}) {
  /**
   * Idempotent append: webhooks may be retried by Razorpay, so an
   * attempt with the same external_payment_id + status is only logged once.
   */
  async logAttempt(input: LogAttemptInput) {
    if (input.external_payment_id) {
      const [existing] = await this.listPaymentAttempts(
        {
          external_payment_id: input.external_payment_id,
          status: input.status,
        },
        { take: 1 }
      )
      if (existing) {
        // Self-heal: a webhook retry may resolve the cart when the first
        // delivery couldn't — fill in the missing linkage instead of
        // discarding it.
        if (!existing.cart_id && input.cart_id) {
          return await this.updatePaymentAttempts({
            id: existing.id,
            cart_id: input.cart_id,
            customer_id: existing.customer_id ?? input.customer_id ?? null,
          })
        }
        return existing
      }
    }

    return await this.createPaymentAttempts(input)
  }

  /**
   * Stamp the order on all attempts of a cart once it converts.
   */
  async markConverted(cart_id: string, order_id: string) {
    const attempts = await this.listPaymentAttempts(
      { cart_id },
      { select: ["id"] }
    )

    if (!attempts.length) {
      return []
    }

    return await this.updatePaymentAttempts(
      attempts.map((a) => ({ id: a.id, order_id }))
    )
  }
}
