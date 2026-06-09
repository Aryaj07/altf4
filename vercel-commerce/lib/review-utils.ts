import { unstable_cache } from 'next/cache';
import { sdkReview } from 'lib/sdk/sdk-review';

export type ProductRating = {
  average: number;
  count: number;
};

export type ProductRatingsMap = Record<string, ProductRating>;

async function fetchRatings(productIds: string[]): Promise<ProductRatingsMap> {
  const map: ProductRatingsMap = {};

  const results = await Promise.allSettled(
    productIds.map(async (id) => {
      const res = await sdkReview.store.productReviews.listStats({
        product_id: id,
        offset: 0,
        limit: 1,
      });
      const stats = (res as any)?.product_review_stats?.[0];
      return {
        id,
        average: stats?.average_rating || 0,
        count: stats?.review_count || 0
      };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.count > 0) {
      const { id, average, count } = result.value;
      map[id] = { average, count };
    }
  }

  return map;
}

/**
 * Fetch review stats for multiple products, cached for 60 seconds.
 * Keyed by the sorted set of product IDs so the same set of products
 * always hits the cache instead of re-fetching on every render.
 */
export async function getProductRatings(productIds: string[]): Promise<ProductRatingsMap> {
  if (!productIds.length) return {};

  const sortedIds = [...productIds].sort();

  return unstable_cache(
    () => fetchRatings(sortedIds),
    ['product-ratings', sortedIds.join(',')],
    { revalidate: 60, tags: ['reviews'] }
  )();
}

/**
 * Fetch review stats for a single product, cached for 60 seconds.
 * Returns { average_rating, review_count } or null.
 */
export async function getCachedProductReviewStats(productId: string): Promise<{ average_rating: number; review_count: number } | null> {
  return unstable_cache(
    async () => {
      try {
        const res = await sdkReview.store.productReviews.listStats({
          product_id: productId,
          offset: 0,
          limit: 1,
        });
        const stats = (res as any)?.product_review_stats?.[0];
        if (stats) return { average_rating: stats.average_rating || 0, review_count: stats.review_count || 0 };
        return null;
      } catch {
        return null;
      }
    },
    ['review-stats', productId],
    { revalidate: 60, tags: ['reviews'] }
  )();
}
