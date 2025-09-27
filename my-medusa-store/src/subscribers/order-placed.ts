// order-placed.ts

import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/medusa"

import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Handlebars from "handlebars"
import orderConfirmationTemplate from "../modules/review_notification/orderConfimationTemplate"
import ReviewService from "../modules/auto_mail/service"

export default async function handleOrderPlaced({ 
  event,
  container, 
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  // 1. Get the storefront URL from environment variables
  const storefrontUrl = process.env.STOREFRONT_URL
  if (!storefrontUrl) {
    // It's good practice to throw an error if the variable isn't set
    throw new Error("STOREFRONT_URL environment variable is not set.")
  }

  const orderId = event.data.id
  let orderService = container.resolve(Modules.ORDER)

  const order = await orderService.retrieveOrder(orderId, {
    select: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "subtotal",
      "shipping_total",
      "tax_total",
      "total",
    ],
    relations: ["items", "shipping_address"],
  });

  logger.info(`order-placed: retrieved order ${order.id} for ${order.email}`)

  const reviewService = container.resolve<ReviewService>("review");

  for (const item of order.items ?? []) {
    // 2. Generate the new review link using the env variable and new format
    const reviewLink = `${storefrontUrl}/review?order_id=${order.id}&order_line_item_id=${item.id}`;

    await reviewService.createReviews({
      order_id: order.id,
      line_item_id: item.id,
      customer_email: order.email,
      customer_first_name: order.shipping_address?.first_name,
      customer_last_name: order.shipping_address?.last_name,
      product_title: item.title,
      product_thumbnail: item.thumbnail,
      review_link: reviewLink,
    })

  logger.info(`order-placed: stored review request for item: ${item.id}`)
  }

  // 3) Send order confirmation email via Notification module (email-provider)
  try {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    const currency = (order as any)?.currency_code || "usd"
    const formatMoney = (amount?: number | null) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(((amount ?? 0) as number))

    const resolveImageUrl = (u?: string) => {
      const url = u || ""
      if (!url) return ""
      // If already absolute, return as-is; otherwise fall back to using the storefront origin
      if (/^https?:\/\//i.test(url)) return url
      const origin = (process.env.STOREFRONT_URL || "").replace(/\/$/, "")
      return origin ? `${origin}${url.startsWith("/") ? url : `/${url}`}` : url
    }

    const itemsRaw = order.items || []
    const items = itemsRaw.map((it: any) => {
      const unit = it.unit_price ?? 0
      const qty = it.quantity ?? 0
      const lineTotal = typeof it.total === "number" ? it.total : unit * qty
      return {
        title: it.title,
        quantity: qty,
        unit_price_formatted: formatMoney(unit),
        line_total_formatted: formatMoney(lineTotal),
        thumbnail: resolveImageUrl(it.thumbnail),
      }
    })

    // Derive totals if not present on the order
    const subtotalMinor = itemsRaw.reduce((acc: number, it: any) => {
      const unit = it.unit_price ?? 0
      const qty = it.quantity ?? 0
      const lineTotal = typeof it.total === "number" ? it.total : unit * qty
      return acc + lineTotal
    }, 0)
    const shippingMinor = (order as any)?.shipping_total ?? 0
    const taxMinor = (order as any)?.tax_total ?? 0
    const totalMinor = (order as any)?.total ?? subtotalMinor + shippingMinor + taxMinor

    const templateContext = {
      orderNumber: (order as any)?.id,
      customerFirstName: (order as any)?.shipping_address?.first_name || "there",
      items,
      totals: {
        subtotal_formatted: formatMoney((order as any)?.subtotal ?? subtotalMinor),
        shipping_formatted: formatMoney(shippingMinor),
        tax_formatted: formatMoney(taxMinor),
        total_formatted: formatMoney(totalMinor),
      },
      shippingAddress: {
        full_name: [
          (order as any)?.shipping_address?.first_name,
          (order as any)?.shipping_address?.last_name,
        ]
          .filter(Boolean)
          .join(" "),
        line1: (order as any)?.shipping_address?.address_1 || "",
        line2: (order as any)?.shipping_address?.address_2 || "",
        city: (order as any)?.shipping_address?.city || "",
        province: (order as any)?.shipping_address?.province || "",
        postal_code: (order as any)?.shipping_address?.postal_code || "",
        country: ((order as any)?.shipping_address?.country_code || "").toUpperCase(),
      },
      year: new Date().getFullYear(),
    }

    // Debug log: show computed payload (truncate arrays/strings for readability)
    const debugLog = {
      orderId: order.id,
      toEmail: (order as any)?.email,
      currency,
      itemsCount: items.length,
      firstItem: items[0] ?? null,
      totalsMinor: { subtotalMinor, shippingMinor, taxMinor, totalMinor },
      templateContextPreview: {
        orderNumber: templateContext.orderNumber,
        items: templateContext.items.slice(0, 2),
        totals: templateContext.totals,
      },
    }
    logger.info(`order-placed: email debug -> ${JSON.stringify(debugLog)}`)

    const html = Handlebars.compile(orderConfirmationTemplate)(templateContext)

    const fromEmail = process.env.MJ_FROM_EMAIL || "info@altf4gear.com"
    const fromName = process.env.MJ_FROM_NAME || "Altf4gear Team"

    const toEmail = (order as any)?.email
    if (toEmail) {
      const subject = `Order confirmed: ${(order as any)?.id}`
      await notificationModuleService.createNotifications({
        // Placeholder recipient for records; provider reads from data.messages
        to: "batch-review-mails",
        channel: "email",
        template: "order-confirmation",
        data: {
          messages: [
            {
              From: { Email: fromEmail, Name: fromName },
              To: [{ Email: toEmail }],
              Subject: subject,
              HTMLPart: html,
              TrackOpens: "disabled",
              TrackClicks: "disabled",
            },
          ],
        },
      })
      logger.info(`order-placed: queued order confirmation for ${order.id} -> ${toEmail}`)
    } else {
      logger.warn(`order-placed: missing customer email for ${order.id}`)
    }
  } catch (e: any) {
    logger.error(`order-placed: failed to queue order confirmation email -> ${e?.message || e}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed", 
  context: {
    subscriberId: "order-placed-handler",
  },
}