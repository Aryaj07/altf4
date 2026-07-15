import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

export type StampCartRecoveryMetadataStepInput = {
  cart_id: string
  existing_metadata?: Record<string, unknown> | null
  manual: boolean
}

/**
 * Records the recovery-email send on the cart so the manual button and the
 * (optional) cron job never double-send. Compensates by restoring the
 * previous metadata if a later step fails.
 */
export const stampCartRecoveryMetadataStep = createStep(
  "stamp-cart-recovery-metadata",
  async (
    { cart_id, existing_metadata, manual }: StampCartRecoveryMetadataStepInput,
    { container }
  ) => {
    const cartModuleService = container.resolve(Modules.CART)

    const sent_at = new Date().toISOString()
    await cartModuleService.updateCarts([
      {
        id: cart_id,
        metadata: {
          ...(existing_metadata ?? {}),
          abandoned_notification: { sent_at, manual },
        },
      },
    ])

    return new StepResponse(
      { sent_at },
      { cart_id, previous_metadata: existing_metadata ?? {} }
    )
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }
    const cartModuleService = container.resolve(Modules.CART)
    await cartModuleService.updateCarts([
      {
        id: compensation.cart_id,
        metadata: compensation.previous_metadata as Record<string, unknown>,
      },
    ])
  }
)
