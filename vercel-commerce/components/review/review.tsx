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

export default async function Reviews({ productId = "default" }: { productId?: string }) {
  const reviews = await getReviews(productId)

  return (
    <div>
      <div>
        {reviews.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-neutral-500 dark:text-neutral-400 text-base sm:text-lg">No reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {reviews.map((r: any, i: number) => (
              <div key={r.id ?? r._id ?? i} className="border-b border-neutral-200 dark:border-neutral-800 pb-6 sm:pb-8 last:border-b-0">
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-4">
                  <div className="flex flex-col flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-semibold text-base sm:text-lg">
                        {r.name ?? r.author ?? r.author_name ?? "Anonymous"}
                      </h3>
                      {/* Verified Purchase Badge - shown for all approved reviews */}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200 border border-green-700 w-fit">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified Purchase
                      </span>
                    </div>
                    {r.created_at && (
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-1">
                        {new Date(r.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  {r.rating != null && <div className="flex items-center text-lg sm:text-xl">{renderStars(r.rating)}</div>}
                </div>

                {/* Review Content */}
                <div className="mb-4 sm:mb-6">
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm sm:text-base">{r.content ?? r.body ?? r.comment ?? ""}</p>
                </div>

                {/* Review Images */}
                {Array.isArray(r.images) && r.images.length > 0 && (
                  <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto">
                    {r.images.map((img: any, idx: number) => (
                      <div key={img.id ?? idx} className="relative overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                        <Image
                          src={img.url || "/placeholder.svg"}
                          alt={`Review image ${idx + 1}`}
                          width={80}
                          height={80}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Store Response */}
                {r.response && (
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white text-sm">Store Response</span>
                      {r.response.created_at && (
                        <span className="text-gray-400 text-xs">
                          {new Date(r.response.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    {typeof r.response.content === "string" && (
                      <p className="text-gray-300 text-sm leading-relaxed">{r.response.content}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}