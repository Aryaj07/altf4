import clsx from 'clsx';
import Image from 'next/image';
import Label from '../label';
import React from 'react';

export function GridTileImage({
  isInteractive = true,
  active,
  label,
  rating,
  ...props
}: {
  isInteractive?: boolean;
  active?: boolean;
  label?: {
    title: string;
    amount: string;
    currencyCode: string;
    position?: 'bottom' | 'center';
    isPreorder?: boolean;
  };
  rating?: {
    average: number;
    count: number;
  } | null;
} & React.ComponentProps<typeof Image>) {
  return (
    <div
      className={clsx(
        'flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-white hover:border-blue-600 dark:bg-black',
        {
          relative: label,
          'border-2 border-blue-600': active,
          'border-neutral-200 dark:border-neutral-800': !active
        }
      )}
    >
      {props.src ? (
        <Image
          className={clsx('relative h-full w-full object-contain', {
            'transition duration-300 ease-in-out hover:scale-105': isInteractive
          })}
          {...props}
        />
      ) : null}
      {label?.isPreorder && (
        <div className="absolute top-4 left-4">
          <span className="rounded-full bg-purple-600 px-3 py-1.5 text-xs text-white shadow-lg" style={{ fontFamily: 'Inter-Bold, Inter, sans-serif', fontWeight: 600 }}>
            Pre-Order
          </span>
        </div>
      )}
      {/* Star rating badge */}
      {rating && rating.count > 0 && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-black backdrop-blur-md dark:bg-black/70 dark:text-white">
            <svg
              viewBox="0 0 20 20"
              width="14"
              height="14"
              aria-hidden="true"
              className="text-yellow-500"
            >
              <path
                fill="currentColor"
                d="M10 15.27l-5.18 3.04 1.64-5.64L1 7.64l5.9-.5L10 2l3.1 5.14 5.9.5-5.46 4.03 1.64 5.64L10 15.27z"
              />
            </svg>
            <span>{rating.average.toFixed(1)}</span>
            <span className="text-neutral-500 dark:text-neutral-400">({rating.count})</span>
          </div>
        </div>
      )}
      {label ? (
        <Label
          title={label.title}
          amount={label.amount}
          currencyCode={label.currencyCode}
          position={label.position}
        />
      ) : null}
    </div>
  );
}
