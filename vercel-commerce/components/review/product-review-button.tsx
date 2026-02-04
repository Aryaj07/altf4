'use client';

import { useState, useEffect } from 'react';
import { Star, AlertCircle } from 'lucide-react';
import { Button } from "@/src/components/ui/button";
import { WriteReviewModal } from './write-review-modal';

type OrderItem = {
  id: string;
  product_id: string;
  title: string;
  variant_title?: string;
  thumbnail?: string;
  hasReview: boolean;
  reviewId?: string;
};

export function ProductReviewButton({ productId }: { productId: string }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasedItems, setPurchasedItems] = useState<{ orderId: string; item: OrderItem }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ orderId: string; item: OrderItem } | null>(null);

  useEffect(() => {
    checkAuthAndOrders();
  }, [productId]);

  async function checkAuthAndOrders() {
    try {
      // Check if user is authenticated
      const authRes = await fetch('/api/me');
      
      if (!authRes.ok) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Get customer's orders
      const ordersRes = await fetch('/api/customer-orders');
      
      if (!ordersRes.ok) {
        setLoading(false);
        return;
      }

      const { reviewableItems } = await ordersRes.json();

      // Find the item for this specific product
      const productItem = reviewableItems?.find(
        (item: any) => item.item.product_id === productId
      );
      
      const items: { orderId: string; item: OrderItem }[] = [];
      
      if (productItem) {
        items.push({
          orderId: productItem.orderId,
          item: productItem.item
        });
      }
      
      setPurchasedItems(items);
      setLoading(false);
    } catch (error) {
      console.error('Error checking orders:', error);
      setLoading(false);
    }
  }

  function handleWriteReview() {
    if (purchasedItems.length > 0) {
      setSelectedItem(purchasedItems[0]);
      setShowModal(true);
    }
  }

  function handleReviewSubmitted() {
    checkAuthAndOrders();
    setShowModal(false);
  }

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              Want to write a review?
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Please <a href="/login" className="underline hover:no-underline">log in</a> to share your experience with this product.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but hasn't purchased or already reviewed
  if (purchasedItems.length === 0) {
    return null;
  }

  // Has purchased and can review
  return (
    <>
      <div className="mt-4">
        <Button
          onClick={handleWriteReview}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          size="lg"
        >
          <Star className="mr-2 h-5 w-5" />
          Write a Review
        </Button>
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
          Verified purchase • Share your experience
        </p>
      </div>

      {/* Review Modal */}
      {showModal && selectedItem && (
        <WriteReviewModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          orderId={selectedItem.orderId}
          orderItem={selectedItem.item}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </>
  );
}
