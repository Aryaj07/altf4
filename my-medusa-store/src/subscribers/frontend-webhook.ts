import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework/subscribers";

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-category.created",
    "product-category.updated",
    "product-category.deleted",
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted"
  ],
  context: {
    subscriberId: "frontend-revalidation",
  },
};

export default async function handleFrontendWebhook({
  event: { name, data },
}: SubscriberArgs<any>) {
  // Build webhook URL from environment variables
  const storefront = process.env.STOREFRONT_URL || process.env.FRONTEND_WEBHOOK_URL;
  const secret = process.env.MEDUSA_REVALIDATION_SECRET;

  if (!storefront || !secret) {
    console.error("[Frontend Webhook] Missing STOREFRONT_URL or MEDUSA_REVALIDATION_SECRET");
    return;
  }

  // Construct the full webhook URL
  const frontendUrl = storefront.includes('/api/revalidate') 
    ? storefront 
    : `${storefront}/api/revalidate`;

  console.log(`[Frontend Webhook] Event received: ${name}`);
  console.log(`[Frontend Webhook] Sending webhook to: ${frontendUrl}?secret=***`);

  try {
    // Send HTTP request to frontend revalidation endpoint
    const response = await fetch(`${frontendUrl}?secret=${secret}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-medusa-topic': name,
      },
      body: JSON.stringify({ data }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[Frontend Webhook] ✓ Frontend revalidated successfully for ${name}:`, result);
    } else {
      console.error(`[Frontend Webhook] ✗ Failed to revalidate frontend (${response.status}):`, await response.text());
    }
  } catch (error) {
    console.error(`[Frontend Webhook] Error sending webhook for ${name}:`, error);
  }
}
