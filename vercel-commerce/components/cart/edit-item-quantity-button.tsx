"use client";

import { useTransition } from 'react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import LoadingDots from 'components/loading-dots';
import { useCart } from './cart-context';
import type { CartItem } from 'lib/medusa/types';

export default function EditItemQuantityButton({
  item,
  type,
}: {
  item: CartItem;
  type: 'plus' | 'minus';
}) {
  const { refreshCart } = useCart();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      aria-label={type === 'plus' ? 'Increase item quantity' : 'Reduce item quantity'}
      onClick={() => {
        startTransition(async () => {
          let res;

          if (type === 'minus' && item.quantity - 1 === 0) {
            res = await fetch("/api/cart/remove-item", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ lineId: item.id }),
            });
          } else {
            res = await fetch("/api/cart/update-item", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                lineId: item.id,
                variantId: item.merchandise.id,
                quantity:
                  type === 'plus' ? item.quantity + 1 : item.quantity - 1,
              }),
            });
          }

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Cart update failed: ${text}`);
          }

          await refreshCart();
        });
      }}
      disabled={isPending}
      className={clsx(
        'ease flex h-full min-w-[36px] max-w-[36px] flex-none items-center justify-center rounded-full px-2 transition-all duration-200 hover:border-neutral-800 hover:opacity-80',
        {
          'cursor-not-allowed': isPending,
          'ml-auto': type === 'minus',
        }
      )}
    >
      {isPending ? (
        <LoadingDots className="bg-black dark:bg-white" />
      ) : type === 'plus' ? (
        <PlusIcon className="h-4 w-4 dark:text-neutral-500" />
      ) : (
        <MinusIcon className="h-4 w-4 dark:text-neutral-500" />
      )}
    </button>
  );
}
