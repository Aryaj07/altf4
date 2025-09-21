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
    <div className="bg-black text-white min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {reviews.map((r: any, i: number) => (
              <div key={r.id ?? r._id ?? i} className="border-b border-gray-800 pb-8 last:border-b-0">
                {/* Review Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-white text-lg">
                      {r.name ?? r.author ?? r.author_name ?? "Anonymous"}
                    </h3>
                    {r.created_at && (
                      <p className="text-gray-400 text-sm mt-1">
                        {new Date(r.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  {r.rating != null && <div className="flex items-center">{renderStars(r.rating)}</div>}
                </div>

                {/* Review Content */}
                <div className="mb-6">
                  <p className="text-gray-200 leading-relaxed text-base">{r.content ?? r.body ?? r.comment ?? ""}</p>
                </div>

                {/* Review Images */}
                {Array.isArray(r.images) && r.images.length > 0 && (
                  <div className="flex gap-3 mb-6">
                    {r.images.map((img: any, idx: number) => (
                      <div key={img.id ?? idx} className="relative overflow-hidden rounded-lg bg-gray-800">
                        <Image
                          src={img.url || "/placeholder.svg"}
                          alt={`Review image ${idx + 1}`}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover hover:scale-105 transition-transform duration-200"
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