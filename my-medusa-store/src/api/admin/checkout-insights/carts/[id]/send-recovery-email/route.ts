import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendCartRecoveryEmailWorkflow } from "../../../../../../workflows/send-cart-recovery-email"

const RESEND_COOLDOWN_HOURS = 24

/**
 * POST /admin/checkout-insights/carts/:id/send-recovery-email
 * Body (optional): { "force": true } to bypass the resend cooldown.
 *
 * The manual "send recovery email" button. Runs the same workflow the
 * scheduled abandoned-cart job uses, and stamps the cart metadata so
 * neither path double-sends within the cooldown.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const cartId = req.params.id
    const force = !!(req.body as any)?.force

    const { data: carts } = await query.graph({
      entity: "cart",
      fields: ["id", "email", "completed_at", "metadata", "items.id"],
      filters: { id: cartId },
    })

    const cart = carts?.[0] as any
    if (!cart) {
      res.status(404).json({ message: `Cart ${cartId} not found` })
      return
    }
    if (cart.completed_at) {
      res.status(400).json({
        message: "Cart is already completed — nothing to recover",
      })
      return
    }
    if (!cart.email) {
      res.status(400).json({
        message: "Cart has no email address to send to",
      })
      return
    }
    if (!(cart.items?.length > 0)) {
      res.status(400).json({ message: "Cart has no items" })
      return
    }

    const lastSentAt = cart.metadata?.abandoned_notification?.sent_at
    if (lastSentAt && !force) {
      const hoursSince =
        (Date.now() - new Date(lastSentAt).getTime()) / (1000 * 60 * 60)
      if (hoursSince < RESEND_COOLDOWN_HOURS) {
        res.status(409).json({
          message: `Recovery email already sent at ${lastSentAt}. Pass { "force": true } to resend.`,
          sent_at: lastSentAt,
        })
        return
      }
    }

    const { result } = await sendCartRecoveryEmailWorkflow(req.scope).run({
      input: { cart_id: cartId, manual: true },
    })

    res.json({ sent: true, ...result })
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Internal error" })
  }
}
