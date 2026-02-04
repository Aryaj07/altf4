import { sdkReview } from 'lib/sdk/sdk-review';
import { ReviewsList } from './reviews-list';

async function getReviews(productId: string): Promise<any[]> {
  try {
    const res = await sdkReview.store.productReviews.list({
      product_id: productId,
      offset: 0,
      limit: 100, // Increased from 10 to show all reviews
    });
    // SDK typically returns { product_reviews, count }
    if (res && Array.isArray((res as any).product_reviews)) {
      return (res as any).product_reviews.filter(
        (review: any) => review.status === "approved"
      );
    }
    // fallback if SDK returns an array directly
    if (Array.isArray(res)) {
      return res;
    }

    return [];
  } catch (err) {
    console.error('Failed to fetch reviews', err);
    return [];
  }
}

export default async function Reviews({ productId = "default" }: { productId?: string }) {
  const reviews = await getReviews(productId)

  return <ReviewsList reviews={reviews} />
}