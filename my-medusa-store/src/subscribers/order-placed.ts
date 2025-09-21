// order-placed.ts

import { 
  type SubscriberArgs, 
  type SubscriberConfig,
} from "@medusajs/medusa"

import { Modules } from "@medusajs/framework/utils"

export default async function handleOrderPlaced({ 
  event,
  container, 
}: SubscriberArgs<{ id: string }>) {
  // 1. Get the storefront URL from environment variables
  const storefrontUrl = process.env.STOREFRONT_URL
  if (!storefrontUrl) {
    // It's good practice to throw an error if the variable isn't set
    throw new Error("STOREFRONT_URL environment variable is not set.")
  }

  const orderId = event.data.id
  let orderService = container.resolve(Modules.ORDER)

  const order = await orderService.retrieveOrder(orderId, {
    relations: ["items", "shipping_address"],                 
  })

  console.log(`Successfully retrieved order for customer: ${order.email}`)

  const reviewService = container.resolve("review")

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

    console.log(`Stored review request for item: ${item.id} with link: ${reviewLink}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed", 
  context: {
    subscriberId: "order-placed-handler",
  },
}