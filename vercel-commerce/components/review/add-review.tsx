"use client"

import * as React from "react"
import { useState } from "react"
import Image from "next/image"
import { Button } from "@/src/components/ui/button"
import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { sdkReview } from "lib/sdk/sdk-review"
import { StarRating } from "./star-rating"
import { Send, AlertTriangle, CheckCircle, Upload, X} from "lucide-react"

export default function AddReview({
  orderId,
  orderLineItemId,
}: {
  orderId: string
  orderLineItemId: string
}) {
  const [rating, setRating] = useState<number>(5)
  const [content, setContent] = useState<string>("")
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Prevent multiple uploads
    if (uploading) {
      console.log('Upload already in progress, skipping...')
      return
    }

    // Limit to 4 images total
    const remainingSlots = 4 - uploadedImages.length
    if (remainingSlots <= 0) {
      alert("You can only upload up to 4 images per review")
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    
    // Validate file types and sizes
    const validFiles = filesToUpload.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isUnder5MB = file.size <= 5 * 1024 * 1024 // 5MB limit
      
      if (!isImage) {
        alert(`${file.name} is not an image file`)
        return false
      }
      if (!isUnder5MB) {
        alert(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      validFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API}/store/review-images`, {
        method: 'POST',
        headers: {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || '',
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload failed:', response.status, errorText)
        throw new Error(`Failed to upload images: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      console.log('=== IMAGE UPLOAD DEBUG ===')
      console.log('Response data:', data)
      console.log('Returned images:', data.images)
      console.log('Current uploadedImages before update:', uploadedImages)
      
      if (data.images && data.images.length > 0) {
        // Filter out duplicates before adding
        setUploadedImages(prev => {
          console.log('Previous state:', prev)
          const newImages = data.images.filter((url: string) => !prev.includes(url))
          console.log('New images to add:', newImages)
          const updated = [...prev, ...newImages]
          console.log('Updated state:', updated)
          return updated
        })
        setMessage(`${data.images.length} image(s) uploaded successfully!`)
        setIsError(false)
      }
      console.log('========================')
    } catch (err: any) {
      console.error("Failed to upload images", err)
      setMessage("Failed to upload images. Please try again.")
      setIsError(true)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function removeImage(index: number) {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Prevent double submission
    if (loading) {
      console.log('Submission already in progress, skipping...')
      return
    }
    
    setLoading(true)
    setMessage(null)
    setIsError(false)

    // Ensure unique image URLs before submission (plugin may duplicate)
    const uniqueImageUrls = [...new Set(uploadedImages)];
    
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

    console.log('=== REVIEW SUBMISSION DEBUG ===')
    console.log('uploadedImages state:', uploadedImages)
    console.log('uploadedImages.length:', uploadedImages.length)
    console.log('Unique URLs:', [...new Set(uploadedImages)])
    console.log('Full payload:', JSON.stringify(payload, null, 2))
    console.log('Images in payload:', payload.reviews[0]?.images)
    console.log('================================')

    try {
      const result = await sdkReview.store.productReviews.upsert(payload)
      console.log('Review submission result:', result)
      setMessage("Thank you! Your review has been submitted successfully.")
      setContent("")
      setUploadedImages([])
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

        <div className="space-y-3">
          <Label className="text-gray-300">
            Photos <span className="text-gray-500">(Optional, up to 4)</span>
          </Label>
          
          {/* Image Preview Grid */}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                  <Image
                    src={url}
                    alt={`Review image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {uploadedImages.length < 4 && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="review-image-upload"
              />
              <label htmlFor="review-image-upload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Images ({uploadedImages.length}/4)
                    </>
                  )}
                </Button>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG, or GIF. Max 5MB per image.
              </p>
            </div>
          )}
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
