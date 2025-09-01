import { sdkReview } from 'lib/sdk/sdk-review';
import Image from "next/image";

async function getReviews(productId: string): Promise<any[]> {
  try {
    const res = await sdkReview.store.productReviews.list({
      product_id: productId,
      offset: 0,
      limit: 10,
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

function renderStars(rating: number) {
  return (
    <span className="text-yellow-500">
      {"★".repeat(Math.round(rating)).padEnd(5, "☆")}
    </span>
  );
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
            <li
              key={r.id ?? r._id ?? i}
              className="border-b border-gray-200 pb-4 mb-6"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold">
                  {r.author ?? r.author_name ?? 'Anonymous'}
                </span>
                {r.rating != null && renderStars(r.rating)}
              </div>
              {r.created_at && (
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
              <p className="italic mb-3">
                {r.content ?? r.body ?? r.comment ?? ''}
              </p>

              {/* Review images */}
              {Array.isArray(r.images) && r.images.length > 0 ? (
                <div className="flex gap-2 mb-3">
                  {r.images.map((img: any, idx: number) => (
                    <Image
                      key={idx}
                      src={img.url}
                      alt={`review-img-${idx}`}
                      width={80}
                      height={80}
                      className="w-20 h-20 bg-gray-200 object-cover rounded"
                    />
                  ))}
                </div>
              ) : null}

              {/* Store response */}
              {r.store_response && (
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <strong>Store Response</strong>{" "}
                  {r.store_response_date && (
                    <span className="text-gray-500">
                      {new Date(r.store_response_date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  <p>{r.store_response}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}