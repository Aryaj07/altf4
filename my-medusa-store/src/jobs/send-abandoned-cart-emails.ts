import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendCartRecoveryEmailWorkflow } from "../workflows/send-cart-recovery-email"

/**
 * Scheduled job: emails customers who abandoned a cart.
 *
 * A cart qualifies when it:
 *  - is not completed and has an email + at least one item
 *  - has been inactive for ABANDONED_CART_INACTIVE_HOURS (default 24)
 *  - never received a recovery email (cart.metadata.abandoned_notification),
 *    whether from this job or the manual dashboard button — each cart is
 *    emailed at most once automatically
 *
 * Env knobs:
 *  ABANDONED_CART_CRON            cron schedule (default "0 4 * * *" = 09:30 IST)
 *  ABANDONED_CART_INACTIVE_HOURS  inactivity threshold (default 24)
 *  ABANDONED_CART_DRY_RUN         "true" = log candidates, send nothing
 */
export default async function sendAbandonedCartEmailsJob(
  container: MedusaContainer
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const inactiveHours = parseInt(
    process.env.ABANDONED_CART_INACTIVE_HOURS || "24"
  )
  const dryRun = process.env.ABANDONED_CART_DRY_RUN === "true"
  const cutoff = new Date(Date.now() - inactiveHours * 60 * 60 * 1000)

  const BATCH = 100
  let offset = 0
  let sent = 0
  let failed = 0
  const candidates: { cart_id: string; email: string }[] = []

  while (true) {
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: ["id", "email", "metadata", "updated_at", "items.id"],
      filters: {
        completed_at: null,
        updated_at: { $lt: cutoff.toISOString() },
      },
      pagination: { take: BATCH, skip: offset, order: { updated_at: "DESC" } },
    })

    if (!carts.length) {
      break
    }
    offset += carts.length

    for (const cart of carts as any[]) {
      const qualifies =
        !!cart.email &&
        (cart.items?.length ?? 0) > 0 &&
        !cart.metadata?.abandoned_notification

      if (!qualifies) {
        continue
      }
      // One email per address per run — carts are ordered newest-first, so
      // a customer with several stale carts only hears about the latest one.
      if (candidates.some((c) => c.email === cart.email)) {
        continue
      }
      candidates.push({ cart_id: cart.id, email: cart.email })
    }

    if (carts.length < BATCH) {
      break
    }
  }

  if (dryRun) {
    logger.info(
      `abandoned-cart-job (DRY RUN): would email ${candidates.length} cart(s): ${candidates
        .map((c) => `${c.cart_id} -> ${c.email}`)
        .join(", ") || "none"}`
    )
    return
  }

  for (const { cart_id, email } of candidates) {
    try {
      await sendCartRecoveryEmailWorkflow(container).run({
        input: { cart_id, manual: false },
      })
      sent++
      logger.info(`abandoned-cart-job: sent recovery email for ${cart_id} -> ${email}`)
    } catch (e: any) {
      failed++
      logger.warn(
        `abandoned-cart-job: failed for ${cart_id} -> ${e?.message || e}`
      )
    }
  }

  logger.info(
    `abandoned-cart-job: done. candidates=${candidates.length} sent=${sent} failed=${failed}`
  )
}

export const config = {
  name: "send-abandoned-cart-emails",
  schedule: process.env.ABANDONED_CART_CRON || "0 4 * * *",
}
