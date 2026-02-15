'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { GridTileImage } from 'components/grid/tile';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

export function Gallery({
  images,
  currentIndex = 0,
  onIndexChange
}: {
  images: { src: string; altText: string }[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchMovedRef = useRef(false);

  if (!images?.length) {
    return (
      <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden">
        <div className="flex h-full items-center justify-center bg-neutral-100 dark:bg-neutral-900">
          <p className="text-sm text-neutral-500">No image available</p>
        </div>
      </div>
    );
  }

  const imageIndex = Math.min(currentIndex, images.length - 1);

  // Preload adjacent images
  useEffect(() => {
    const toPreload = new Set(loadedImages);
    toPreload.add(imageIndex);
    // Preload next and previous
    if (images.length > 1) {
      toPreload.add((imageIndex + 1) % images.length);
      toPreload.add(imageIndex === 0 ? images.length - 1 : imageIndex - 1);
    }
    // Preload all remaining in background
    const timer = setTimeout(() => {
      images.forEach((_, i) => toPreload.add(i));
      setLoadedImages(new Set(toPreload));
    }, 1000);

    setLoadedImages(new Set(toPreload));
    return () => clearTimeout(timer);
  }, [imageIndex, images.length]);

  const goTo = (index: number) => {
    onIndexChange?.(index);
  };

  const goNext = useCallback(() => {
    goTo(imageIndex + 1 < images.length ? imageIndex + 1 : 0);
  }, [imageIndex, images.length]);

  const goPrev = useCallback(() => {
    goTo(imageIndex === 0 ? images.length - 1 : imageIndex - 1);
  }, [imageIndex, images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchMovedRef.current = false;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      touchMovedRef.current = true;
      setSwipeOffset(dx);
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current) return;

    if (touchMovedRef.current) {
      if (swipeOffset < -50) goNext();
      else if (swipeOffset > 50) goPrev();
    }

    touchStartRef.current = null;
    touchMovedRef.current = false;
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  return (
    <>
      {/* Main image with swipe */}
      <div
        className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Render current + adjacent images for instant swipe transitions */}
        {images.map((image, i) => {
          const shouldRender = loadedImages.has(i);
          if (!shouldRender) return null;

          const isVisible = i === imageIndex;

          return (
            <div
              key={image.src}
              className="absolute inset-0 h-full w-full"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible && isSwiping ? `translateX(${swipeOffset}px)` : 'translateX(0)',
                transition: isSwiping ? 'none' : 'opacity 0.15s ease-out, transform 0.15s ease-out',
                pointerEvents: isVisible ? 'auto' : 'none',
                zIndex: isVisible ? 1 : 0,
              }}
            >
              <Image
                className="h-full w-full object-contain"
                fill
                sizes="(min-width: 1024px) 66vw, 100vw"
                alt={image.altText}
                src={image.src}
                priority={i === 0}
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          );
        })}

        {/* Dot indicators on mobile */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5 sm:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === imageIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Arrow buttons - desktop only */}
      {images.length > 1 ? (
        <div className="mt-4 hidden w-full justify-center sm:flex">
          <div className="flex h-12 items-center gap-4 rounded-full border border-neutral-200 bg-white px-4 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
            <button
              aria-label="Previous product image"
              onClick={goPrev}
              className="flex h-full items-center justify-center px-4 transition-colors hover:text-black dark:hover:text-white"
            >
              <ArrowLeftIcon className="h-5" />
            </button>
            <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-700" />
            <button
              aria-label="Next product image"
              onClick={goNext}
              className="flex h-full items-center justify-center px-4 transition-colors hover:text-black dark:hover:text-white"
            >
              <ArrowRightIcon className="h-5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Thumbnail strip */}
      {images.length > 1 ? (
        <ul className="mt-4 flex items-center gap-2 overflow-x-auto px-1 py-1 sm:justify-center sm:my-8 lg:mb-0 scrollbar-hide">
          {images.map((image, index) => (
            <li key={image.src} className="h-16 w-16 flex-shrink-0 sm:h-20 sm:w-20">
              <button
                aria-label={`Select image ${index + 1}`}
                onClick={() => goTo(index)}
                className="h-full w-full block"
              >
                <GridTileImage
                  alt={image.altText}
                  src={image.src}
                  width={80}
                  height={80}
                  active={index === imageIndex}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
