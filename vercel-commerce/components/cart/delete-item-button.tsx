"use client";

import CloseIcon from 'components/icons/close';
import LoadingDots from 'components/loading-dots';

import clsx from 'clsx';
import type { CartItem } from 'lib/medusa/types';
import { useState } from 'react';
import { useCart } from './cart-context';

export default function DeleteItemButton({ item }: { item: CartItem }) {
  const { setCart } = useCart();
  const [isPending, setIsPending] = useState(false);

  const handleRemove = async () => {
    setIsPending(true);
    try {
      const res = await fetch("/api/cart/remove-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineId: item.id }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Remove item failed: ${text}`);
      }

      const data = await res.json();
      if (data.cart) {
        setCart(data.cart);
      }
    } catch (err) {
      console.error('Error removing item:', err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      aria-label="Remove cart item"
      onClick={handleRemove}
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
