import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { sendCartRecoveryEmailStep } from "./steps/send-cart-recovery-email"
import { stampCartRecoveryMetadataStep } from "./steps/stamp-cart-recovery-metadata"

type WorkflowInput = {
  cart_id: string
  /** true when triggered from the admin button, false for the cron job */
  manual: boolean
}

/**
 * Shared by the admin "Send recovery email" button and the optional
 * scheduled abandoned-cart job. Sends the Mailjet email, then stamps
 * cart.metadata.abandoned_notification so neither path double-sends.
 */
export const sendCartRecoveryEmailWorkflow = createWorkflow(
  "send-cart-recovery-email",
  (input: WorkflowInput) => {
    // Read-only: totals come straight from the cart via the same computed
    // fields the Store API uses (items.is_tax_inclusive included — without
    // it the totals decorator adds tax on top of tax-inclusive prices).
    // The cart is never mutated by sending an email.
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      fields: [
        "id",
        "email",
        "currency_code",
        "total",
        "metadata",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.total",
        // REQUIRED for correct totals: Medusa's totals decorator only sees
        // the fields you fetch — without is_tax_inclusive it treats prices
        // as tax-exclusive and adds tax on top (₹6,000 became ₹7,080).
        "items.is_tax_inclusive",
        "items.thumbnail",
        "shipping_address.first_name",
        "customer.id",
        "customer.first_name",
      ],
      filters: { id: input.cart_id },
      options: { throwIfKeyNotFound: true },
    })

    const stepInput = transform({ carts, input }, ({ carts, input }) => {
      const cart = carts[0] as any
      return {
        manual: input.manual,
        cart: {
          id: cart.id,
          email: cart.email,
          currency_code: cart.currency_code,
          customer_id: cart.customer?.id ?? null,
          total: cart.total != null ? Number(cart.total) : null,
          items: (cart.items ?? []).map((it: any) => ({
            title: it.title,
            quantity: Number(it.quantity ?? 0),
            unit_price: it.unit_price != null ? Number(it.unit_price) : null,
            total: it.total != null ? Number(it.total) : null,
            thumbnail: it.thumbnail,
          })),
          first_name:
            cart.customer?.first_name ??
            cart.shipping_address?.first_name ??
            null,
        },
      }
    })

    const sendResult = sendCartRecoveryEmailStep(stepInput)

    const stampInput = transform(
      { carts, input },
      ({ carts, input }) => ({
        cart_id: input.cart_id,
        existing_metadata: (carts[0] as any).metadata ?? {},
        manual: input.manual,
      })
    )

    const stampResult = stampCartRecoveryMetadataStep(stampInput)

    return new WorkflowResponse(
      transform({ sendResult, stampResult }, ({ sendResult, stampResult }) => ({
        sent_to: sendResult.sent_to,
        sent_at: stampResult.sent_at,
      }))
    )
  }
)
