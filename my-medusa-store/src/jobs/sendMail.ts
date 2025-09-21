import {
  type MedusaContainer,
} from "@medusajs/medusa";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function myCustomJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);

  let deliveredOrderIds: string[] = [];

  // 1) Fetch all orders and filter to those with any delivered fulfillment
  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "fulfillments.delivered_at"],
    });

    deliveredOrderIds = (orders || [])
      .filter(
        (o: any) =>
          Array.isArray(o.fulfillments) &&
          o.fulfillments.some((f: any) => !!f?.delivered_at)
      )
      .map((o: any) => o.id);

    logger.info(
      `Found ${deliveredOrderIds.length} orders with delivered fulfillments.`
    );
    console.log(deliveredOrderIds);
  } catch (error) {
    logger.error("Error fetching orders:", error as any);
  }

  // 2) Trigger notification only if we have delivered orders
  try {
    if (deliveredOrderIds.length === 0) {
      logger.info("No delivered orders found. Skipping notification trigger.");
      return;
    }

    logger.info("Triggering the review email notification provider...");

    await notificationModuleService.createNotifications({
      to: "batch-review-mails", // placeholder recipient for batch
      channel: "email",
      template: "send-review-emails",
      data: { order_ids: deliveredOrderIds }, // pass target orders
    });

    logger.info(
      `Review email provider triggered for ${deliveredOrderIds.length} orders.`
    );
  } catch (error) {
    logger.error("Error triggering the notification provider:", error as any);
  }
}

export const config = {
  name: "daily-product-report-and-review-trigger",
  // e.g. run weekly: "0 0 * * 1"
  schedule: "0 0 * * 1",
};