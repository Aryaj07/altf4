import { Suspense } from "react"
import { type Metadata } from "next"
import ReviewClientPage from "./review-client-page"

export const metadata: Metadata = {
  title: "Write a Review",
  description: "Share your experience with our product.",
}

// This is the main server component for the page.
// It uses Suspense to handle the client component that reads search params.
export default function AddReviewPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <Suspense fallback={<AddReviewSkeleton />}>
          <ReviewClientPage />
        </Suspense>
      </div>
    </div>
  )
}

// A simple loading skeleton to show while the client component loads
function AddReviewSkeleton() {
  return (
    <section className="mt-8 rounded-lg border border-neutral-200 bg-dark p-6 md:p-8 dark:border-neutral-800">
      <div className="h-6 w-1/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="mt-6 space-y-5">
        <div className="space-y-2">
          <div className="h-4 w-1/5 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex space-x-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
        <div className="h-32 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-10 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </section>
  )
}