import type {
  SubscriberConfig,
  SubscriberArgs,
} from "@medusajs/framework";

export default async function registerWebhooksHandler({
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger");
  
  const frontendUrl = process.env.FRONTEND_WEBHOOK_URL;
  const secret = process.env.MEDUSA_REVALIDATION_SECRET;
  
  if (!frontendUrl || !secret) {
    logger.warn("Frontend webhook URL or revalidation secret not configured. Skipping webhook registration.");
    return;
  }

  const webhookUrl = `${frontendUrl}?secret=${secret}`;
  
  logger.info(`Registering frontend revalidation webhooks to: ${webhookUrl}`);

  // Note: Automatic webhook registration requires admin API access
  // For now, this serves as documentation. 
  // You can manually create webhooks in Medusa Admin or use the Admin API
  
  const webhooksToRegister = [
    // Product events
    { event: 'product.created', description: 'Product created' },
    { event: 'product.updated', description: 'Product updated' },
    { event: 'product.deleted', description: 'Product deleted' },
    
    // Category events
    { event: 'product_category.created', description: 'Category created' },
    { event: 'product_category.updated', description: 'Category updated' },
    { event: 'product_category.deleted', description: 'Category deleted' },
    
    // Inventory events for stock changes
    { event: 'inventory_item.created', description: 'Inventory item created' },
    { event: 'inventory_item.updated', description: 'Inventory item updated' },
    { event: 'inventory_item.deleted', description: 'Inventory item deleted' },
    { event: 'inventory_level.updated', description: 'Inventory level updated' },
    { event: 'inventory_level.deleted', description: 'Inventory level deleted' },
  ];

  logger.info("Required webhooks for frontend revalidation:");
  webhooksToRegister.forEach(({ event, description }) => {
    logger.info(`  - ${event}: ${description} -> ${webhookUrl}`);
  });
  
  logger.info("Please configure these webhooks manually in Medusa Admin or refer to WEBHOOK_SETUP.md");
}

export const config: SubscriberConfig = {
  event: "application.started",
};
