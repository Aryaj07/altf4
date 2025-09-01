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
    <div className="">
      <div className="flex items-center mb-4">
        <span className="text-2xl font-bold">{average}</span>
        <div className="ml-2 text-yellow-500">
          {"★".repeat(Math.round(stats.average_rating || 0)).padEnd(5, "☆")}
        </div>
        <span className="ml-2 text-sm text-gray-500">
          Based on {total} review{total === 1 ? "" : "s"}
        </span>
      </div>

      {/* Star breakdown */}
      {[5, 4, 3, 2, 1].map((star, idx) => (
        <div key={star} className="flex items-center mb-2">
          <span className="w-8 text-sm">{star} ★</span>
          <div className="flex-1 h-2 mx-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-yellow-500 rounded"
              style={{ width: `${starPercentages[idx]}%` }}
            ></div>
          </div>
          <span className="w-10 text-sm text-gray-600">
            {starPercentages[idx]}%
          </span>
        </div>
      ))}
    </div>
  );
}