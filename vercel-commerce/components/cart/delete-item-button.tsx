"use client";

import CloseIcon from 'components/icons/close';
import LoadingDots from 'components/loading-dots';

import clsx from 'clsx';
import type { CartItem } from 'lib/medusa/types';
import { useTransition } from 'react';
import { useCart } from './cart-context';

export default function DeleteItemButton({ item }: { item: CartItem }) {
  const { refreshCart } = useCart();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      aria-label="Remove cart item"
      onClick={() => {
        startTransition(async () => {
          const res = await fetch("/api/cart/remove-item", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ lineId: item.id }),
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Remove item failed: ${text}`);
          }

          await refreshCart();
        });
      }}
      disabled={isPending}
      className={clsx(
        'ease flex h-[17px] w-[17px] items-center justify-center rounded-full bg-neutral-500 transition-all duration-200',
        {
          'cursor-not-allowed px-0': isPending,
        }
      )}
    >
      {isPending ? (
        <LoadingDots className="bg-white" />
      ) : (
        <CloseIcon className="hover:text-accent-3 mx-[1px] h-4 w-4 text-white dark:text-black" />
      )}
    </button>
  );
}
