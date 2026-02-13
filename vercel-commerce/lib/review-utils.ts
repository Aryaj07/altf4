import { sdkReview } from 'lib/sdk/sdk-review';

export type ProductRating = {
  average: number;
  count: number;
};

export type ProductRatingsMap = Record<string, ProductRating>;

/**
 * Fetch review stats for multiple products in parallel.
 * Returns a map of productId -> { average, count }
 */
export async function getProductRatings(productIds: string[]): Promise<ProductRatingsMap> {
  const map: ProductRatingsMap = {};

  if (!productIds.length) return map;

  // Fetch in parallel
  const results = await Promise.allSettled(
    productIds.map(async (id) => {
      const res = await sdkReview.store.productReviews.listStats({
        product_id: id,
        offset: 0,
        limit: 1,
      });
      const stats = (res as any)?.product_review_stats?.[0];
      if (stats && stats.review_count > 0) {
        return {
          id,
          average: stats.average_rating || 0,
          count: stats.review_count || 0
        };
      }
      return { id, average: 0, count: 0 };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const { id, average, count } = result.value;
      if (count > 0) {
        map[id] = { average, count };
      }
    }
  }

  return map;
}
