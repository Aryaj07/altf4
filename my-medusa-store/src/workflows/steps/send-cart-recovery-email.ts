import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import Handlebars from "handlebars"
import cartRecoveryTemplate from "../../modules/checkout-insights/cartRecoveryTemplate"
import { CHECKOUT_INSIGHTS_MODULE } from "../../modules/checkout-insights"
import CheckoutInsightsModuleService from "../../modules/checkout-insights/service"

export type SendCartRecoveryEmailStepInput = {
  cart: {
    id: string
    email: string
    currency_code: string
    total?: number | null
    customer_id?: string | null
    items: {
      title: string
      quantity: number
      unit_price?: number | null
      total?: number | null
      thumbnail?: string | null
    }[]
    first_name?: string | null
  }
  manual: boolean
}

export const sendCartRecoveryEmailStep = createStep(
  "send-cart-recovery-email",
  async ({ cart, manual }: SendCartRecoveryEmailStepInput, { container }) => {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    const currency = cart.currency_code || "inr"
    const formatMoney = (amount?: number | null) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format((amount ?? 0) as number)

    const resolveImageUrl = (u?: string | null) => {
      const url = u || ""
      if (!url) return ""
      if (/^https?:\/\//i.test(url)) return url
      const origin = (process.env.STOREFRONT_URL || "").replace(/\/$/, "")
      return origin ? `${origin}${url.startsWith("/") ? url : `/${url}`}` : url
    }

    const items = (cart.items || []).map((it) => {
      const lineTotal =
        typeof it.total === "number"
          ? it.total
          : (it.unit_price ?? 0) * (it.quantity ?? 0)
      return {
        title: it.title,
        quantity: it.quantity,
        line_total_formatted: formatMoney(lineTotal),
        thumbnail: resolveImageUrl(it.thumbnail),
      }
    })

    const storefrontUrl = (process.env.STOREFRONT_URL || "").replace(/\/$/, "")
    const storeName = process.env.MJ_FROM_NAME || "Altf4gear Team"

    const html = Handlebars.compile(cartRecoveryTemplate)({
      customerFirstName: cart.first_name || "there",
      items,
      total_formatted: formatMoney(cart.total),
      // Recovery route restores the cart cookie on any device, then
      // forwards to checkout — a plain /cart link 404'd (cart is a modal)
      cartUrl: `${storefrontUrl}/cart/recover/${cart.id}`,
      storeName,
      year: new Date().getFullYear(),
    })

    const fromEmail = process.env.MJ_FROM_EMAIL || "info@altf4gear.com"
    const subject = "Your cart is waiting for you"

    await notificationModuleService.createNotifications({
      // Same Mailjet provider convention as the order-confirmation flow:
      // recipient placeholder, real message in data.messages.
      to: "cart-recovery",
      channel: "email",
      template: "cart-recovery",
      data: {
        messages: [
          {
            From: { Email: fromEmail, Name: storeName },
            To: [{ Email: cart.email }],
            Subject: subject,
            HTMLPart: html,
            TrackOpens: "disabled",
            TrackClicks: "disabled",
          },
        ],
      },
    })

    // Record exactly what was sent — shown in the admin "Recovery emails"
    // section so sends can be verified (recipient, items, value, rendered HTML).
    const insights = container.resolve<CheckoutInsightsModuleService>(
      CHECKOUT_INSIGHTS_MODULE
    )
    const record = await insights.createRecoveryEmails({
      cart_id: cart.id,
      customer_id: cart.customer_id ?? null,
      email: cart.email,
      subject,
      html,
      // json column typed as Record<string, unknown>; a JSON array is valid
      items: items.map((it) => ({
        title: it.title,
        quantity: it.quantity,
        line_total_formatted: it.line_total_formatted,
      })) as unknown as Record<string, unknown>,
      total_formatted: formatMoney(cart.total),
      manual,
    })

    return new StepResponse({ sent_to: cart.email, record_id: record.id })
  }
)
