"use client"

import { useSearchParams } from "next/navigation"

// Make sure this import path points to your actual AddReview component file
import AddReview from "components/review/add-review" 

export default function ReviewClientPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const orderLineItemId = searchParams.get("order_line_item_id")

  // If the required URL parameters are missing, show an error message
  if (!orderId || !orderLineItemId) {
    return (
      <div className="mt-8 rounded-lg border border-red-300 bg-red-50 p-6 text-center text-red-800">
        <h3 className="text-lg font-semibold">Invalid Link</h3>
        <p className="mt-2">
          The link you used is missing required information. Please use the
          original link provided in your email.
        </p>
      </div>
    )
  }

  // If parameters are present, render your component and pass the props
  return <AddReview orderId={orderId} orderLineItemId={orderLineItemId} />
}