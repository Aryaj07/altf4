"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { sdkReview } from "lib/sdk/sdk-review"
import { StarRating } from "./star-rating"
import { Send, AlertTriangle, CheckCircle } from "lucide-react"

export default function AddReview({
  orderId,
  orderLineItemId,
}: {
  orderId: string
  orderLineItemId: string
}) {
  const [rating, setRating] = useState<number>(5)
  const [content, setContent] = useState<string>("")
  const [images, setImages] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setIsError(false)

    const imageUrls = images
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4)

    const uniqueImageUrls = Array.from(new Set(imageUrls))

    const payload = {
      reviews: [
        {
          order_id: orderId,
          order_line_item_id: orderLineItemId,
          rating,
          content,
          images: uniqueImageUrls.map((url) => ({ url })),
        },
      ],
    }

    try {
      await sdkReview.store.productReviews.upsert(payload)
      setMessage("Thank you! Your review has been submitted successfully.")
      setContent("")
      setImages("")
      setRating(5)
    } catch (err: any) {
      console.error("Failed to submit review", err)
      setMessage(err?.message ?? "An unexpected error occurred. Please try again.")
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="w-full max-w-2xl mx-auto my-12 rounded-xl border border-gray-800 bg-gray-900 p-6 md:p-8 shadow-2xl text-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Write a Review</h2>
        <p className="mt-2 text-sm text-gray-400">
          Let us and other customers know what you think about your purchase.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-2 text-center">
          <Label className="text-gray-300">Your Rating</Label>
          <div className="flex justify-center">
            <StarRating
              value={rating}
              onChange={setRating}
              aria-label="Select rating"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-content" className="text-gray-300">
            Review
          </Label>
          <Textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="Share your experience with this product..."
            className="min-h-32 bg-gray-800 border-gray-700 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-images" className="text-gray-300">
            Image URLs <span className="text-gray-500">(Optional)</span>
          </Label>
          <Input
            id="review-images"
            value={images}
            onChange={(e) => setImages(e.target.value)}
            placeholder="https://... , https://..."
            className="bg-gray-800 border-gray-700 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500">
            Add up to 4 comma-separated image URLs to show with your review.
          </p>
        </div>

        <div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            size="lg"
          >
            {loading ? (
              "Submitting..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Review
              </>
            )}
          </Button>
        </div>

        {message && (
          <div
            role="status"
            className={`flex items-center gap-3 rounded-md p-4 text-sm ${
              isError
                ? "bg-red-900/20 border border-red-500/30 text-red-300"
                : "bg-green-900/20 border border-green-500/30 text-green-300"
            }`}
          >
            {isError ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <span>{message}</span>
          </div>
        )}
      </form>
    </section>
  )
}