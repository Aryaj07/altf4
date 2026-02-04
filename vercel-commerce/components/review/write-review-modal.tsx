'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { sdkReview } from "lib/sdk/sdk-review";
import { StarRating } from "./star-rating";
import { Send, AlertTriangle, CheckCircle, Upload, X } from "lucide-react";
import React from 'react';

type OrderItem = {
  id: string;
  product_id: string;
  title: string;
  variant_title?: string;
  thumbnail?: string;
};

type WriteReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderItem: OrderItem;
  onReviewSubmitted?: () => void;
};

export function WriteReviewModal({ 
  isOpen, 
  onClose, 
  orderId, 
  orderItem,
  onReviewSubmitted 
}: WriteReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setRating(5);
      setContent("");
      setUploadedImages([]);
      setMessage(null);
      setIsError(false);
    }
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || uploading) return;

    const remainingSlots = 4 - uploadedImages.length;
    if (remainingSlots <= 0) {
      alert("You can only upload up to 4 images per review");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    const validFiles = filesToUpload.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder5MB = file.size <= 5 * 1024 * 1024;
      
      if (!isImage) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      if (!isUnder5MB) {
        alert(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      validFiles.forEach(file => formData.append('files', file));

      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API}/store/review-images`, {
        method: 'POST',
        headers: {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || '',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload images');
      }

      const data = await response.json();
      
      if (data.images && data.images.length > 0) {
        setUploadedImages(prev => {
          const newImages = data.images.filter((url: string) => !prev.includes(url));
          return [...prev, ...newImages];
        });
        setMessage(`${data.images.length} image(s) uploaded successfully!`);
        setIsError(false);
      }
    } catch (err: any) {
      console.error("Failed to upload images", err);
      setMessage("Failed to upload images. Please try again.");
      setIsError(true);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (loading) return;
    
    setLoading(true);
    setMessage(null);
    setIsError(false);

    const uniqueImageUrls = [...new Set(uploadedImages)];
    
    const payload = {
      reviews: [
        {
          order_id: orderId,
          order_line_item_id: orderItem.id,
          rating,
          content,
          images: uniqueImageUrls.map((url) => ({ url })),
        },
      ],
    };

    try {
      await sdkReview.store.productReviews.upsert(payload);
      setMessage("Thank you! Your review has been submitted successfully.");
      setTimeout(() => {
        onReviewSubmitted?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Failed to submit review", err);
      setMessage(err?.message ?? "An unexpected error occurred. Please try again.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-6 md:p-8 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Write a Review</h2>
            <p className="text-sm text-gray-400 mt-1">
              Share your experience with {orderItem.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info */}
        <div className="flex gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
          {orderItem.thumbnail && (
            <Image 
              src={orderItem.thumbnail} 
              alt={orderItem.title}
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded"
            />
          )}
          <div>
            <p className="font-medium">{orderItem.title}</p>
            {orderItem.variant_title && (
              <p className="text-sm text-gray-400">{orderItem.variant_title}</p>
            )}
          </div>
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

            {uploadedImages.length < 4 && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="review-image-upload-modal"
                  ref={(el) => el && (fileInputRef as any) === el}
                />
                <label htmlFor="review-image-upload-modal">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                    onClick={() => document.getElementById('review-image-upload-modal')?.click()}
                  >
                    {uploading ? "Uploading..." : (
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

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              size="lg"
            >
              {loading ? "Submitting..." : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Review
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
              size="lg"
            >
              Cancel
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
      </div>
    </div>
  );
}
