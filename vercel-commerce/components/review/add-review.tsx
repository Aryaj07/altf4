// ...existing code...
"use client";
import React, { useState } from "react";
import { sdkReview } from "lib/sdk/sdk-review";

export default function AddReview({
  orderId,
  orderLineItemId,
}: {
  orderId: string;
  orderLineItemId: string;
}) {
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>("");
  const [images, setImages] = useState<string>(""); // comma separated URLs
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // build payload inline (no exported DTO type in this file)
    const payload = {
      reviews: [
        {
          order_id: orderId,
          order_line_item_id: orderLineItemId,
          rating,
          content,
          images: images
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((url) => ({ url })),
        },
      ],
    };

    try {
      // proper API call using the SDK
      const review = await sdkReview.store.productReviews.upsert(payload);
      console.log("Upsert response:", review);
      setMessage("Review submitted successfully.");
      setContent("");
      setImages("");
      setRating(5);
    } catch (err: any) {
      console.error("Failed to submit review", err);
      setMessage(err?.message ?? "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Rating
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label>
          Review
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Image URLs (comma separated)
          <input
            value={images}
            onChange={(e) => setImages(e.target.value)}
            placeholder="https://... , https://..."
          />
        </label>
      </div>

      <div>
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </div>

      {message && <div>{message}</div>}
    </form>
  );
}