/* eslint-disable no-unused-vars */
'use client';

import clsx from 'clsx';
import { ProductOption, ProductVariant, StoreProductVariantWithPreorder } from 'lib/medusa/types';
import { useCallback, useEffect, useState } from 'react';
import { isPreorder as checkIsPreorder } from 'lib/medusa/utils';

type Combination = {
  id: string;
  availableForSale: boolean;
  inStock: boolean;
  isPreorder: boolean;
  [key: string]: string | boolean;
};

const isVariantInStock = (variant: ProductVariant): boolean => {
  const qty = (variant as any)?.inventory_quantity;
  return typeof qty === 'number' ? qty > 0 : true;
};

const isVariantPreorder = (variant: ProductVariant): boolean => {
  return checkIsPreorder((variant as StoreProductVariantWithPreorder)?.preorder_variant);
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
  const [selected, setSelected] = useState<Record<string, string>>({});

  const hasNoOptionsOrJustOneOption =
    !options.length || (options.length === 1 && options[0]?.values.length === 1);

  const combinations: Combination[] = variants.map((variant) => ({
    id: variant.id,
    availableForSale: variant.availableForSale,
    inStock: isVariantInStock(variant),
    isPreorder: isVariantPreorder(variant),
    ...variant.selectedOptions.reduce(
      (acc, opt) => ({ ...acc, [opt.name.toLowerCase()]: opt.value }),
      {}
    )
  }));

  useEffect(() => {
    if (!onVariantChange) return;

    const selectedEntries = Object.entries(selected);
    if (selectedEntries.length === 0) {
      onVariantChange(undefined);
      return;
    }

    const matchingVariant = variants.find((variant) =>
      variant.selectedOptions.every(
        (opt) => selected[opt.name.toLowerCase()] === opt.value
      )
    );

    onVariantChange(matchingVariant);
  }, [selected, variants, onVariantChange]);

  const handleSelect = useCallback((optionName: string, value: string) => {
    setSelected((prev) => {
      const key = optionName.toLowerCase();
      if (prev[key] === value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  if (hasNoOptionsOrJustOneOption) {
    return null;
  }

  return (
    <div className="space-y-6 mb-6">
      {options.map((option) => {
        const optionKey = option.name.toLowerCase();

        return (
          <fieldset key={option.id}>
            <legend className="mb-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {option.name}
              {selected[optionKey] && (
                <span className="ml-1.5 font-normal text-neutral-500 dark:text-neutral-400">
                  — {selected[optionKey]}
                </span>
              )}
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const isActive = selected[optionKey] === value;

                const anyVariantExists = combinations.some(
                  (combo) => combo[optionKey] === value && combo.availableForSale && (combo.inStock || combo.isPreorder)
                );

                const disabled = !anyVariantExists;

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && handleSelect(option.name, value)}
                    title={`${option.name}: ${value}${disabled ? ' (Out of Stock)' : ''}`}
                    className={clsx(
                      'rounded-full border px-4 py-2 text-sm transition-all duration-150',
                      {
                        // Active
                        'border-blue-600 bg-blue-600/10 text-blue-600 font-medium ring-1 ring-blue-600 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400':
                          isActive,
                        // Available
                        'border-neutral-300 text-neutral-700 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500':
                          !isActive && !disabled,
                        // Disabled
                        'relative cursor-not-allowed overflow-hidden border-neutral-200 text-neutral-400 before:absolute before:inset-0 before:m-auto before:h-px before:w-[calc(100%+10px)] before:-rotate-[18deg] before:bg-neutral-400 dark:border-neutral-800 dark:text-neutral-600 dark:before:bg-neutral-600':
                          disabled,
                      }
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
