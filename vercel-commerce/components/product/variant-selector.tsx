/* eslint-disable no-unused-vars */
'use client';

import clsx from 'clsx';
import { ProductOption, ProductVariant } from 'lib/medusa/types';
import { createUrl } from 'lib/utils';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

type Combination = {
  id: string;
  availableForSale: boolean;
  inStock: boolean;
  [key: string]: string | boolean; // ie. { color: 'Red', size: 'Large', ... }
};

// Helper function to check if variant is in stock
const isVariantInStock = (variant: ProductVariant): boolean => {
  const stockQuantity = (variant as any)?.inventory_quantity;
  return typeof stockQuantity === 'number' ? stockQuantity > 0 : true; // Default to true if no inventory data
};

export function VariantSelector({
  options,
  variants,
  onVariantChange
}: {
  options: ProductOption[];
  variants: ProductVariant[];
  onVariantChange?: (variant: ProductVariant | undefined) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasNoOptionsOrJustOneOption =
    !options.length || (options.length === 1 && options[0]?.values.length === 1);

  useEffect(() => {
    if (!onVariantChange) return;

    // Find the variant that matches all current search params
    const currentVariant = variants.find((variant) =>
      variant.selectedOptions.every(
        (option) => option.value === searchParams.get(option.name.toLowerCase())
      )
    );

    onVariantChange(currentVariant);
  }, [searchParams, variants, onVariantChange]);

  if (hasNoOptionsOrJustOneOption) {
    return null;
  }

  const combinations: Combination[] = variants.map((variant) => ({
    id: variant.id,
    availableForSale: variant.availableForSale,
    inStock: isVariantInStock(variant),
    // Adds key / value pairs for each variant (ie. "color": "Black" and "size": 'M").
    ...variant.selectedOptions.reduce(
      (accumulator, option) => ({ ...accumulator, [option.name.toLowerCase()]: option.value }),
      {}
    )
  }));

  return options.map((option) => (
    <dl className="mb-8" key={option.id}>
      <dt className="mb-4 text-sm uppercase tracking-wide">{option.name}</dt>
      <dd className="flex flex-wrap gap-3">
        {option.values.map((value) => {
          const optionNameLowerCase = option.name.toLowerCase();

          // Base option params on current params so we can preserve any other param state in the url.
          const optionSearchParams = new URLSearchParams(searchParams.toString());

          // Update the option params using the current option to reflect how the url *would* change,
          // if the option was clicked.
          optionSearchParams.set(optionNameLowerCase, value);
          const optionUrl = createUrl(pathname, optionSearchParams);

          // Check if this specific combination is available for sale AND in stock
          const filtered = Array.from(optionSearchParams.entries()).filter(([key, value]) =>
            options.find(
              (option) => option.name.toLowerCase() === key && option.values.includes(value)
            )
          );
          
          const matchingCombination = combinations.find((combination) =>
            filtered.every(
              ([key, value]) => combination[key] === value && combination.availableForSale
            )
          );

          // Include stock status in availability check
          const isAvailableForSale = matchingCombination && matchingCombination.inStock;

          // The option is active if it's in the url params.
          const isActive = searchParams.get(optionNameLowerCase) === value;

          // You can't disable a link, so we need to render something that isn't clickable.
          const isLink = isAvailableForSale;
          
          return isLink ? (
            <Link
              key={value}
              href={optionUrl}
              scroll={false}
              aria-disabled={!isAvailableForSale}
              title={`${option.name} ${value}${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
              className={clsx(
                'flex min-w-[48px] items-center justify-center rounded-full border bg-neutral-100 px-2 py-1 text-sm dark:border-neutral-800 dark:bg-neutral-900',
                {
                  'cursor-default ring-2 ring-blue-600': isActive,
                  'ring-1 ring-transparent transition duration-300 ease-in-out hover:scale-110 hover:ring-blue-600':
                    !isActive && isAvailableForSale,
                  'relative z-10 cursor-not-allowed overflow-hidden bg-neutral-100 text-neutral-500 ring-1 ring-neutral-300 before:absolute before:inset-x-0 before:-z-10 before:h-px before:-rotate-45 before:bg-neutral-300 before:transition-transform dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700 before:dark:bg-neutral-700':
                    !isAvailableForSale
                }
              )}
            >
              {value}
            </Link>
          ) : (
            <p
              key={value}
              aria-disabled={!isAvailableForSale}
              title={`${option.name} ${value}${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
              className={clsx(
                'flex min-w-[48px] items-center justify-center rounded-full border bg-neutral-100 px-2 py-1 text-sm dark:border-neutral-800 dark:bg-neutral-900',
                {
                  'cursor-default ring-2 ring-blue-600': isActive,
                  'ring-1 ring-transparent transition duration-300 ease-in-out hover:scale-110 hover:ring-blue-600':
                    !isActive && isAvailableForSale,
                  'relative z-10 cursor-not-allowed overflow-hidden bg-neutral-100 text-neutral-500 ring-1 ring-neutral-300 before:absolute before:inset-x-0 before:-z-10 before:h-px before:-rotate-45 before:bg-neutral-300 before:transition-transform dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700 before:dark:bg-neutral-700':
                    !isAvailableForSale
                }
              )}
            >
              {value}
            </p>
          );
        })}
      </dd>
    </dl>
  ));
}