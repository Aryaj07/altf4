'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { GridTileImage } from 'components/grid/tile';
import type { ProductRatingsMap } from 'lib/review-utils';

type SerializedProduct = {
  id: string;
  handle: string;
  title: string;
  featuredImage: { url: string; altText?: string };
  priceRange: { maxVariantPrice: { amount: string; currencyCode: string } };
  isPreorder: boolean;
  isSoldOut: boolean;
};

type ProductGroup = [SerializedProduct, SerializedProduct, SerializedProduct];

function GridItem({
  item,
  size,
  priority,
  ratings,
  visible,
}: {
  item: SerializedProduct;
  size: 'full' | 'half';
  priority?: boolean;
  ratings?: ProductRatingsMap;
  visible: boolean;
}) {
  return (
    <div
      className={`transition-opacity duration-700 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'} ${
        size === 'full' ? 'md:col-span-4 md:row-span-2' : 'md:col-span-2 md:row-span-1'
      }`}
    >
      <Link className="relative block aspect-square h-full w-full" href={`/product/${item.handle}`}>
        <GridTileImage
          src={item.featuredImage.url}
          fill
          sizes={
            size === 'full' ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 100vw'
          }
          priority={priority}
          alt={item.title}
          label={{
            position: 'bottom',
            title: item.title,
            amount: item.priceRange.maxVariantPrice.amount,
            currencyCode: item.priceRange.maxVariantPrice.currencyCode,
            isPreorder: item.isPreorder,
            isSoldOut: item.isSoldOut,
          }}
          rating={item.id && ratings?.[item.id] ? ratings[item.id] : null}
        />
      </Link>
    </div>
  );
}

export default function RotatingThreeItemGrid({
  productGroups,
  ratings,
  intervalMs = 5000,
}: {
  productGroups: ProductGroup[];
  ratings: ProductRatingsMap;
  intervalMs?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const cycleProducts = useCallback(() => {
    // Fade out
    setVisible(false);

    // After fade out completes, switch products and fade in
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % productGroups.length);
      setVisible(true);
    }, 700); // Match the duration-700 transition
  }, [productGroups.length]);

  useEffect(() => {
    if (productGroups.length <= 1) return;

    const interval = setInterval(cycleProducts, intervalMs);
    return () => clearInterval(interval);
  }, [cycleProducts, intervalMs, productGroups.length]);

  const [first, second, third] = productGroups[currentIndex]!;

  return (
    <section className="mx-auto grid max-w-screen-2xl gap-4 px-4 pb-4 md:grid-cols-6 md:grid-rows-2 lg:max-h-[calc(100vh-200px)]">
      <GridItem size="full" item={first} priority={currentIndex === 0} ratings={ratings} visible={visible} />
      <GridItem size="half" item={second} priority={currentIndex === 0} ratings={ratings} visible={visible} />
      <GridItem size="half" item={third} ratings={ratings} visible={visible} />
    </section>
  );
}
