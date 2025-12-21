import { sdkReview } from "@/lib/sdk/sdk-review";

async function getReviewStats(productId: string): Promise<any | null> {
  try {
    const res = await sdkReview.store.productReviews.listStats({
      product_id: productId,
      offset: 0,
      limit: 100,
    });
    console.log("Review stats response:", res);
    if (res && (res as any).product_review_stats) {
      return res.product_review_stats;
    }

    return null;
  } catch (err) {
    console.error("Failed to fetch review stats", err);
    return null;
  }
}

function getStarPercentages(statsArr: any[]) {
  // Use the first stats object (if present)
  const stats = statsArr && statsArr.length > 0 ? statsArr[0] : null;
  if (!stats) return [0, 0, 0, 0, 0];

  const total = stats.review_count || 0;
  const starCounts = [
    stats.rating_count_5 || 0,
    stats.rating_count_4 || 0,
    stats.rating_count_3 || 0,
    stats.rating_count_2 || 0,
    stats.rating_count_1 || 0,
  ];

  return starCounts.map((count) =>
    total > 0 ? Math.round((count / total) * 100) : 0
  );
}

export default async function SummaryReview({ productId }: { productId: string }) {
  const statsArr = await getReviewStats(productId);

  if (!statsArr || statsArr.length === 0) {
    return <div>No review summary available.</div>;
  }

  const stats = statsArr[0];
  const average = stats.average_rating != null ? stats.average_rating.toFixed(1) : "N/A";
  const total = stats.review_count != null ? stats.review_count : "N/A";
  const starPercentages = getStarPercentages(statsArr);

  return (
    <div className="lg:sticky lg:top-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <span className="text-3xl sm:text-4xl font-bold">{average}</span>
        <div className="flex flex-col gap-1">
          <div className="text-yellow-500 text-xl sm:text-2xl">
            {"★".repeat(Math.round(stats.average_rating || 0)).padEnd(5, "☆")}
          </div>
          <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Based on {total} review{total === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Star breakdown */}
      {[5, 4, 3, 2, 1].map((star, idx) => (
        <div key={star} className="flex items-center mb-2 sm:mb-3">
          <span className="w-8 sm:w-10 text-xs sm:text-sm font-medium">{star} ★</span>
          <div className="flex-1 h-2 mx-2 sm:mx-3 bg-neutral-200 dark:bg-neutral-700 rounded-full">
            <div
              className="h-2 bg-yellow-500 rounded-full transition-all duration-300"
              style={{ width: `${starPercentages[idx]}%` }}
            ></div>
          </div>
          <span className="w-10 sm:w-12 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 text-right">
            {starPercentages[idx]}%
          </span>
        </div>
      ))}
    </div>
  );
}