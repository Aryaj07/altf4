import { sdkReview } from 'lib/sdk/sdk-review';


// You will eventually replace this with your actual data fetching logic
async function getReviews(productId: string): Promise<any[]> {
  try {
    const res = await sdkReview.store.productReviews.list({
      product_id: productId,
      offset: 0,
      limit: 10,
    });

    // SDK typically returns { product_reviews, count }
    if (res && Array.isArray((res as any).product_reviews)) {
      return (res as any).product_reviews;
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

export default async function Reviews({ productId }: { productId: string }) {
  const reviews = await getReviews(productId);

  return (
    <div>
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <ul>
          {reviews.map((r: any, i: number) => (
            <li key={r.id ?? r._id ?? i}>
              <strong>{r.title ?? r.summary ?? 'Review'}</strong>
              {r.rating != null && <div>Rating: {r.rating}</div>}
              <p>{r.content ?? r.body ?? r.comment ?? ''}</p>
              <small>{r.author ?? r.author_name ?? 'Anonymous'}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}