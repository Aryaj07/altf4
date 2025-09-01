"use client"

import type * as React from "react"
import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { sdkReview } from "lib/sdk/sdk-review"
import { StarRating } from "./star-rating"

export default function AddReview({
  orderId,
  orderLineItemId,
}: {
  orderId: string
  orderLineItemId: string
}) {
  const [rating, setRating] = useState<number>(5)
  const [content, setContent] = useState<string>("")
  const [images, setImages] = useState<string>("") // comma separated URLs
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    orderId = 'order_01K3PS9YDTQVSXCJKCSYNEJ3JH';
    orderLineItemId = 'ordli_01K3PS9YDVDZSP59M67PD10N0Q';

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
    }

    try {
      await sdkReview.store.productReviews.upsert(payload)
      setMessage("Review submitted successfully.")
      setContent("")
      setImages("")
      setRating(5)
    } catch (err: any) {
      console.error("Failed to submit review", err)
      setMessage(err?.message ?? "Failed to submit review")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-neutral-200 bg-dark p-6 md:p-8 dark:border-neutral-800">
      <h4 className="text-lg font-semibold text-white-900">Write a Review</h4>
      <form onSubmit={handleSubmit} className="mt-4 space-y-5">
        <div className="space-y-2">
          <Label className="text-white-700">Your Rating</Label>
          <StarRating value={rating} onChange={setRating} aria-label="Select rating" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-content" className="text-white-700">
            Review
          </Label>
          <Textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="Share your experience with this product..."
            className="min-h-28"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-images" className="text-white-700">
            Image URLs (comma separated)
          </Label>
          <Input
            id="review-images"
            value={images}
            onChange={(e) => setImages(e.target.value)}
            placeholder="https://... , https://..."
          />
          <p className="text-xs text-white-500">Optional. Add up to 4 image URLs to show with your review.</p>
        </div>

        <div>
          <Button type="submit" disabled={loading} variant={'outline'}>
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </div>

        {message && (
          <div
            role="status"
            className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700"
          >
            {message}
          </div>
        )}
      </form>
    </section>
  )
}
