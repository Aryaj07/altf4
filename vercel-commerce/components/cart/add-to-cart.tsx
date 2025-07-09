"use client";

import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import LoadingDots from 'components/loading-dots';
import { ProductVariant } from 'lib/medusa/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export function AddToCart({
  variants,
  availableForSale,
  onCartUpdate,
  selectedVariant
}: {
  variants: ProductVariant[];
  availableForSale: boolean;
  onCartUpdate?: () => Promise<void>;
  selectedVariant?: ProductVariant;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;

  // If we have a selectedVariant prop, use that, otherwise find it from the URL
  const variant = selectedVariant || variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === searchParams.get(option.name.toLowerCase())
    )
  );

  const selectedVariantId = variant?.id || defaultVariantId;

  const title = !availableForSale
    ? 'Out of stock'
    : !selectedVariantId
    ? 'Please select options'
    : undefined;

  return (
    <button
      aria-label="Add item to cart"
      disabled={isPending || !availableForSale || !selectedVariantId}
      title={title}
      onClick={() => {
        if (!availableForSale || !selectedVariantId) return;

        startTransition(async () => {
          try {
            const res = await fetch("/api/cart/add-item", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                variantId: selectedVariantId,
              }),
            });

            if (!res.ok) {
              const text = await res.text();
              throw new Error(`Add to cart failed: ${text}`);
            }

            router.refresh();
            if (onCartUpdate) {
              await onCartUpdate();
            }
          } catch (error) {
            console.error('Error adding item to cart:', error);
            // You might want to show a toast notification here
          }
        });
      }}
      className={clsx(
        'relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white hover:opacity-90',
        {
          'cursor-not-allowed opacity-60 hover:opacity-60': !availableForSale || !selectedVariantId,
          'cursor-not-allowed': isPending,
        }
      )}
    >
      <div className="absolute left-0 ml-4">
        {!isPending ? <PlusIcon className="h-5" /> : <LoadingDots className="mb-3 bg-white" />}
      </div>
      <span>{availableForSale ? 'Add To Cart' : 'Out Of Stock'}</span>
    </button>
  );
}
