import {
  type MedusaContainer,
} from "@medusajs/medusa";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import Handlebars from "handlebars";
import reviewTemplate from "../modules/review_notification/reviewTemplate";
import { REVIEW_MODULE } from "../modules/auto_mail";
import ReviewService from "../modules/auto_mail/service"

const compileReview = Handlebars.compile(reviewTemplate);

export default async function myCustomJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  const reviewService = container.resolve<ReviewService>(REVIEW_MODULE);

  const fromEmail = process.env.MJ_FROM_EMAIL || "arya@altf4gear.com";
  const fromName = process.env.MJ_FROM_NAME || "Altf4gear Team";

  let deliveredOrderIds: string[] = [];

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

    logger.info(`Found ${deliveredOrderIds.length} orders with delivered fulfillments.`);
  } catch (error) {
    logger.error("Error fetching orders:", error as any);
    return;
  }

  if (deliveredOrderIds.length === 0) {
    logger.info("No delivered orders found. Skipping notification trigger.");
    return;
  }

  // Fetch pending review rows and scope to delivered orders
  let pendingReviews: any[] = [];
  try {
    pendingReviews = await reviewService.listReviews({ is_mail_sent: false });
    pendingReviews = pendingReviews.filter((r: any) => deliveredOrderIds.includes(r.order_id));
  } catch (e) {
    logger.error("Error fetching pending reviews:", e as any);
    return;
  }

  if (!pendingReviews.length) {
    logger.info("No pending reviews for delivered orders. Nothing to email.");
    return;
  }

  // Group reviews by order and draft HTML per order
  const byOrder = new Map<string, any[]>();
  for (const r of pendingReviews) {
    if (!byOrder.has(r.order_id)) byOrder.set(r.order_id, []);
    byOrder.get(r.order_id)!.push(r);
  }

  const messages: any[] = [];
  const reviewIdsToMark: string[] = [];

  for (const [orderId, reviews] of byOrder.entries()) {
    const first = reviews[0];
    const html = compileReview({
      customerFirstName: first.customer_first_name || "there",
      products: reviews.map((it: any) => ({
        product_title: it.product_title,
        product_thumbnail: it.product_thumbnail,
        review_link: it.review_link,
      })),
      year: new Date().getFullYear(),
    });

    messages.push({
      From: { Email: fromEmail, Name: fromName },
      To: [{ Email: first.customer_email, Name: first.customer_first_name || "there" }],
      Subject: "How did we do? Share your feedback!",
      HTMLPart: html,
      TrackOpens: "disabled",
      TrackClicks: "disabled",
    });

    // Collect all review row ids to mark as sent after queuing
    reviews.forEach((it: any) => reviewIdsToMark.push(it.id));
  }

  // Send via Notification module -> email provider (provider will just forward to Mailjet)
  try {
    await notificationModuleService.createNotifications({
      to: "batch-review-mails",
      channel: "email",
      template: "send-review-emails",
      data: { messages },
    });

    // Mark as sent after enqueue (if you need “only on success”, move marking into the provider)
    await reviewService.updateReviews(
      reviewIdsToMark.map((id: string) => ({ id, is_mail_sent: true }))
    );

    logger.info(`Queued ${messages.length} review emails and marked ${reviewIdsToMark.length} rows sent.`);
  } catch (error) {
    logger.error("Error triggering the notification provider:", error as any);
  }
}

export const config = {
  name: "daily-product-report-and-review-trigger",
  schedule: "0 10 * * 1", // Every Monday at 10 AM
};