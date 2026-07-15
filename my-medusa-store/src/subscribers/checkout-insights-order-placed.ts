import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/medusa"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CHECKOUT_INSIGHTS_MODULE } from "../modules/checkout-insights"
import CheckoutInsightsModuleService from "../modules/checkout-insights/service"

/**
 * Stamps the order id onto a cart's payment attempts once it converts,
 * so "failed then recovered" carts are distinguishable from abandoned ones.
 * Runs alongside the existing order-placed-handler subscriber.
 */
export default async function checkoutInsightsOrderPlaced({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderId = event.data.id

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "cart.id"],
      filters: { id: orderId },
    })

    const cartId = orders?.[0]?.cart?.id
    if (!cartId) {
      logger.warn(
        `checkout-insights: no cart linked to order ${orderId}, skipping conversion stamp`
      )
      return
    }

    const insights = container.resolve<CheckoutInsightsModuleService>(
      CHECKOUT_INSIGHTS_MODULE
    )
    const updated = await insights.markConverted(cartId, orderId)
    logger.info(
      `checkout-insights: marked ${updated.length} attempt(s) of cart ${cartId} as converted -> ${orderId}`
    )
  } catch (e: any) {
    logger.error(
      `checkout-insights: failed to mark conversion for order ${orderId} -> ${e?.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
  context: {
    subscriberId: "checkout-insights-order-placed",
  },
}
