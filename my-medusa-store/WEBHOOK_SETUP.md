# Medusa Webhook Setup for Frontend Revalidation

This guide explains how to configure Medusa webhooks to automatically update your frontend when products, categories, or inventory changes occur.

## Overview

The frontend is now configured to:
- Revalidate data every 60 seconds (instead of 12 hours)
- Listen for webhook events from Medusa backend
- Automatically refresh when stock levels, product details, or images change

## Backend Configuration

### 1. Set Environment Variable

In your Medusa backend (`my-medusa-store`), add this to your `.env` file:

```env
# Revalidation secret - must match frontend
MEDUSA_REVALIDATION_SECRET=your-secret-key-here

# Frontend webhook URL (use your actual domain in production)
FRONTEND_WEBHOOK_URL=http://localhost:3000/api/revalidate
```

**Important**: Generate a strong random secret for production:
```bash
openssl rand -base64 32
```

### 2. Configure Webhooks in Medusa Admin

Go to your Medusa Admin panel and create webhooks for the following events:

#### Product Updates
- Event: `product.created`
- Event: `product.updated`
- Event: `product.deleted`
- URL: `https://your-frontend-domain.com/api/revalidate?secret=your-secret-key-here`

#### Category Updates
- Event: `product_category.created`
- Event: `product_category.updated`
- Event: `product_category.deleted`
- URL: `https://your-frontend-domain.com/api/revalidate?secret=your-secret-key-here`

#### Inventory Updates (for stock changes)
- Event: `inventory_item.created`
- Event: `inventory_item.updated`
- Event: `inventory_item.deleted`
- Event: `inventory_level.updated`
- Event: `inventory_level.deleted`
- URL: `https://your-frontend-domain.com/api/revalidate?secret=your-secret-key-here`

### 3. Alternative: Programmatic Webhook Creation

You can also create webhooks programmatically by adding a subscriber in your Medusa backend:

Create a file: `my-medusa-store/src/subscribers/register-webhooks.ts`

```typescript
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";

export default async function registerWebhooksHandler({
  data,
  container,
}: SubscriberArgs<any>) {
  const webhookService = container.resolve("webhookService");
  
  const frontendUrl = process.env.FRONTEND_WEBHOOK_URL;
  const secret = process.env.MEDUSA_REVALIDATION_SECRET;
  
  if (!frontendUrl || !secret) {
    console.warn("Frontend webhook URL or secret not configured");
    return;
  }

  const webhookUrl = `${frontendUrl}?secret=${secret}`;
  
  const events = [
    // Product events
    'product.created',
    'product.updated',
    'product.deleted',
    
    // Category events
    'product_category.created',
    'product_category.updated',
    'product_category.deleted',
    
    // Inventory events
    'inventory_item.created',
    'inventory_item.updated',
    'inventory_item.deleted',
    'inventory_level.updated',
    'inventory_level.deleted',
  ];

  for (const event of events) {
    try {
      // Check if webhook already exists
      const existing = await webhookService.list({
        url: webhookUrl,
        events: [event],
      });

      if (existing.length === 0) {
        await webhookService.create({
          url: webhookUrl,
          events: [event],
        });
        console.log(`Created webhook for ${event}`);
      }
    } catch (error) {
      console.error(`Failed to create webhook for ${event}:`, error);
    }
  }
}

export const config: SubscriberConfig = {
  event: "medusa.start",
};
```

## Frontend Configuration

The frontend already has the webhook endpoint configured at `/api/revalidate`.

Add this to your frontend `.env.local`:

```env
# Must match the backend secret
MEDUSA_REVALIDATION_SECRET=your-secret-key-here
```

## Testing the Setup

### 1. Check Webhook Endpoint

Test that your revalidation endpoint is accessible:

```bash
curl -X POST "http://localhost:3000/api/revalidate?secret=your-secret-key-here" \
  -H "x-medusa-topic: product.updated"
```

You should see: `{"status":200,"revalidated":true,"now":1234567890}`

### 2. Test Real Updates

1. Go to Medusa Admin
2. Update a product (change title, price, or inventory)
3. Wait ~60 seconds
4. Refresh your frontend - changes should appear

## How It Works

1. **60-Second Revalidation**: Pages automatically refresh every 60 seconds
2. **Webhook Triggers**: When you update products/inventory in Medusa admin, it sends a webhook
3. **Cache Invalidation**: The webhook triggers Next.js to invalidate cached data
4. **Immediate Refresh**: Next request will fetch fresh data from backend

## Troubleshooting

### Changes still don't appear?

1. **Check webhook logs** in Medusa Admin to ensure webhooks are being sent
2. **Verify secret** matches in both frontend and backend `.env` files
3. **Check frontend logs** for any revalidation errors
4. **Clear browser cache** or open in incognito mode
5. **Wait 60 seconds** after a change for automatic revalidation

### Webhooks not firing?

- Ensure `FRONTEND_WEBHOOK_URL` is accessible from your Medusa backend
- In local development, you may need to use a tunnel service like ngrok for webhooks
- Check Medusa logs for webhook delivery failures

### For Immediate Testing (Development Only)

If you want instant updates during development, you can manually revalidate:

```typescript
// In any server component or API route
import { revalidateTag } from 'next/cache';

revalidateTag('products');
revalidateTag('categories');
```

## Production Considerations

1. **Use HTTPS**: Webhook URLs must use HTTPS in production
2. **Strong Secret**: Use a cryptographically secure random string
3. **Rate Limiting**: Consider adding rate limiting to the webhook endpoint
4. **Monitoring**: Log webhook events for debugging
5. **Error Handling**: Ensure failed webhooks don't crash your application

## Summary

With this setup:
- ✅ Stock changes reflect automatically
- ✅ Product image updates appear immediately
- ✅ New products show up without frontend restart
- ✅ Category changes sync automatically
- ✅ Maximum 60-second delay for updates
