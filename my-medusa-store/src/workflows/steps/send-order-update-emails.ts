import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import Handlebars from "handlebars"
import orderUpdateTemplate from "../../modules/checkout-insights/orderUpdateTemplate"
import { CHECKOUT_INSIGHTS_MODULE } from "../../modules/checkout-insights"
import CheckoutInsightsModuleService from "../../modules/checkout-insights/service"

export type SendOrderUpdateEmailsStepInput = {
  subject: string
  message: string
  orders: {
    id: string
    display_id?: string | number | null
    email: string
    customer_id?: string | null
    first_name?: string | null
    items: { title: string }[]
  }[]
}

// Mailjet is sent one HTTP request per chunk (not one per order), so a
// 200-order batch is a handful of calls instead of 200. A failure is only
// resolvable at chunk granularity — the provider wrapper (EmailNotificationProvider)
// doesn't surface Mailjet's per-message status back to the caller.
const CHUNK_SIZE = 25

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export const sendOrderUpdateEmailsStep = createStep(
  "send-order-update-emails",
  async (
    { subject, message, orders }: SendOrderUpdateEmailsStepInput,
    { container }
  ) => {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)
    const batch_id = `oueb_${Date.now()}`
    const fromEmail = process.env.MJ_FROM_EMAIL || "info@altf4gear.com"
    const storeName = process.env.MJ_FROM_NAME || "Altf4gear Team"
    const year = new Date().getFullYear()
    const messageHtml = escapeHtml(message).replace(/\n/g, "<br/>")

    const rendered = orders.map((order) => ({
      order,
      html: Handlebars.compile(orderUpdateTemplate)({
        customerFirstName: order.first_name || "there",
        orderDisplayId: order.display_id ?? "",
        items: order.items ?? [],
        messageHtml,
        storeName,
        year,
      }),
    }))

    const succeeded: string[] = []
    const failed: { order_id: string; error: string }[] = []
    const logRows: {
      order_id: string
      order_display_id?: string | null
      customer_id?: string | null
      email: string
      subject: string
      message: string
      html: string
    }[] = []

    for (let i = 0; i < rendered.length; i += CHUNK_SIZE) {
      const chunk = rendered.slice(i, i + CHUNK_SIZE)
      const messages = chunk.map(({ order, html }) => ({
        From: { Email: fromEmail, Name: storeName },
        To: [{ Email: order.email }],
        Subject: subject,
        HTMLPart: html,
        TrackOpens: "disabled",
        TrackClicks: "disabled",
      }))

      try {
        await notificationModuleService.createNotifications({
          to: "order-update",
          channel: "email",
          template: "order-update",
          data: { messages },
        })
        for (const { order, html } of chunk) {
          succeeded.push(order.id)
          logRows.push({
            order_id: order.id,
            order_display_id:
              order.display_id != null ? String(order.display_id) : null,
            customer_id: order.customer_id ?? null,
            email: order.email,
            subject,
            message,
            html,
          })
        }
      } catch (e: any) {
        for (const { order } of chunk) {
          failed.push({ order_id: order.id, error: e?.message ?? "send failed" })
        }
      }
    }

    const insights = container.resolve<CheckoutInsightsModuleService>(
      CHECKOUT_INSIGHTS_MODULE
    )
    if (logRows.length) {
      await insights.logOrderUpdateEmails(batch_id, logRows)
    }

    return new StepResponse({ batch_id, succeeded, failed })
  }
)
