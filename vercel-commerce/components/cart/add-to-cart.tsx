"use client";

import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import LoadingDots from 'components/loading-dots';
import { useCart } from 'components/cart/cart-context';
import { ProductVariant, StoreProductVariantWithPreorder } from 'lib/medusa/types';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { isPreorder as checkIsPreorder } from 'lib/medusa/utils';

export function AddToCart({
  variants,
  availableForSale,
  selectedVariant
}: {
  variants: ProductVariant[];
  availableForSale: boolean;
  onCartUpdate?: () => Promise<void>;
  selectedVariant?: ProductVariant;
}) {
  const searchParams = useSearchParams();
  const { setCart, setItemJustAdded } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const defaultVariant = variants.length === 1 ? variants[0] : undefined;

  const variant = selectedVariant || variants.find((v: ProductVariant) =>
    v.selectedOptions.every(
      (option) => option.value === searchParams.get(option.name.toLowerCase())
    )
  ) || defaultVariant;

  const selectedVariantId = variant?.id || defaultVariantId;

  const isPreorder = variant ? checkIsPreorder((variant as StoreProductVariantWithPreorder)?.preorder_variant) : false;

  const title = !availableForSale
    ? 'Out of stock'
    : !selectedVariantId
    ? 'Please select options'
    : undefined;

  const handleAddToCart = async () => {
    if (!availableForSale || !selectedVariantId || isAdding) return;

    setIsAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/cart/add-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: selectedVariantId,
          isPreorder,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to add item to cart');
        setTimeout(() => setError(null), 5000);
        return;
      }

      const data = await res.json();

      // Use the fresh cart data returned from the API directly
      if (data.cart) {
        setCart(data.cart);
      }
      // Signal that an item was added — triggers modal auto-open
      setItemJustAdded(true);
    } catch (err) {
      console.error('Error adding item to cart:', err);
      setError('An unexpected error occurred');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <button
        aria-label="Add item to cart"
        disabled={isAdding || !availableForSale || !selectedVariantId}
        title={title}
        onClick={handleAddToCart}
        className={clsx(
          'relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white hover:opacity-90',
          {
            'cursor-not-allowed opacity-60 hover:opacity-60': !availableForSale || !selectedVariantId,
            'cursor-not-allowed': isAdding,
          }
        )}
      >
        <div className="absolute left-0 ml-4">
          {!isAdding ? <PlusIcon className="h-5" /> : <LoadingDots className="mb-3 bg-white" />}
        </div>
        <span>
          {availableForSale ? (isPreorder ? 'Pre-Order Now' : 'Add To Cart') : 'Out Of Stock'}
        </span>
      </button>

      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2 fade-in">
          <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4 shadow-lg dark:bg-red-900/20 dark:border-red-800">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
