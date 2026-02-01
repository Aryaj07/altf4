'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { GridTileImage } from 'components/grid/tile';
import { createUrl } from 'lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export function Gallery({ images }: { images: { src: string; altText: string }[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const imageSearchParam = searchParams?.get('image');
  const imageIndex = imageSearchParam ? parseInt(imageSearchParam) : 0;

  // Handle empty images array
  if (!images?.length) {
    return (
      <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden">
        <div className="flex h-full items-center justify-center bg-gray-100">
          <p className="text-sm text-gray-500">No image available</p>
        </div>
      </div>
    );
  }

  // Helper function to create clean search params without 'handle'
  const getCleanSearchParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('handle'); // Remove handle to prevent hydration mismatch
    return params;
  };

  const nextSearchParams = getCleanSearchParams();
  const nextImageIndex = imageIndex + 1 < images.length ? imageIndex + 1 : 0;
  nextSearchParams.set('image', nextImageIndex.toString());
  const nextUrl = createUrl(pathname, nextSearchParams);

  const previousSearchParams = getCleanSearchParams();
  const previousImageIndex = imageIndex === 0 ? images.length - 1 : imageIndex - 1;
  previousSearchParams.set('image', previousImageIndex.toString());
  const previousUrl = createUrl(pathname, previousSearchParams);

  const buttonClassName =
    'h-full px-3 sm:px-6 transition-all ease-in-out hover:scale-110 hover:text-black dark:hover:text-white flex items-center justify-center';

  return (
    <>
      <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden">
        {images[imageIndex] && (
          <Image
            className="h-full w-full object-contain"
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            alt={images[imageIndex]?.altText as string}
            src={images[imageIndex]?.src as string}
            priority={true}
          />
        )}
      </div>

      {images.length > 1 ? (
        <div className="mt-4 flex w-full justify-center">
          <div className="flex h-10 sm:h-12 items-center gap-4 rounded-full border border-neutral-200 bg-white px-4 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
            <Link
              replace
              aria-label="Previous product image"
              href={previousUrl}
              className={buttonClassName}
              scroll={false}
            >
              <ArrowLeftIcon className="h-5 sm:h-6" />
            </Link>
            <div className="h-6 sm:h-8 w-px bg-neutral-300 dark:bg-neutral-700"></div>
            <Link
              replace
              aria-label="Next product image"
              href={nextUrl}
              className={buttonClassName}
              scroll={false}
            >
              <ArrowRightIcon className="h-5 sm:h-6" />
            </Link>
          </div>
        </div>
      ) : null}

      {images.length > 1 ? (
        <ul className="my-12 flex items-center justify-center gap-2 overflow-auto py-1 lg:mb-0">
          {images.map((image, index) => {
            const isActive = index === imageIndex;
            const imageSearchParams = getCleanSearchParams();

            imageSearchParams.set('image', index.toString());

            return (
              <li key={image.src} className="h-20 w-20 flex-shrink-0">
                <Link
                  replace
                  aria-label="Enlarge product image"
                  href={createUrl(pathname, imageSearchParams)}
                  scroll={false}
                  className="h-full w-full block"
                >
                  <GridTileImage
                    alt={image.altText}
                    src={image.src}
                    width={80}
                    height={80}
                    active={isActive}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}
