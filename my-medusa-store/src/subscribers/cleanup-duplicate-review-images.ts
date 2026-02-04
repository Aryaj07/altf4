import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Client } from "pg";

/**
 * Subscriber to clean up duplicate review images
 * This is a workaround for the @lambdacurry/medusa-product-reviews plugin
 * which creates duplicate image entries when saving reviews with images
 */
export default async function cleanupDuplicateReviewImages({
  event,
  container,
}: SubscriberArgs<any>) {
  const query = container.resolve("query");
  
  try {
    // Small delay to ensure all database operations from plugin are complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const { data: reviews } = await query.graph({
      entity: "product_review",
      fields: ["id", "images.*"],
      filters: {
        id: event.data?.id || event.id,
      },
    });

    if (!reviews || reviews.length === 0) return;

    const review = reviews[0];
    
    if (!review.images || review.images.length === 0) return;

    // Find duplicate URLs
    const urlMap = new Map<string, any[]>();
    review.images.forEach((img: any) => {
      if (!urlMap.has(img.url)) {
        urlMap.set(img.url, []);
      }
      urlMap.get(img.url)!.push(img);
    });

    // Find images that have duplicates (keep first, delete rest)
    const imagesToDelete: string[] = [];
    urlMap.forEach((images) => {
      if (images.length > 1) {
        const duplicateIds = images.slice(1).map(img => img.id);
        imagesToDelete.push(...duplicateIds);
      }
    });

    if (imagesToDelete.length > 0) {
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        console.error("DATABASE_URL not found");
        return;
      }
      
      const client = new Client({ connectionString: databaseUrl });
      await client.connect();
      
      try {
        await client.query(
          `DELETE FROM product_review_image WHERE id = ANY($1::text[])`,
          [imagesToDelete]
        );
      } finally {
        await client.end();
      }
    }
  } catch (error) {
    console.error('Error in cleanup subscriber:', error);
  }
}

export const config: SubscriberConfig = {
  event: "product_review.created",
};
