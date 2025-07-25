import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { GridTileImage } from 'components/grid/tile';
import Footer from 'components/layout/footer';
import { Gallery } from 'components/product/gallery';
import { ProductDescriptionWrapper } from 'components/product/product-description-wrapper';
import { HIDDEN_PRODUCT_TAG } from 'lib/constants';
import { getProduct } from 'lib/medusa';
import { Image } from 'lib/medusa/types';
import Link from 'next/link';

export const runtime = 'edge';

export async function generateMetadata({
  params
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const { handle } = await params;
  try {

    const product = await getProduct(handle);

    if (!product) {
      console.warn(`Product not found for handle: ${params.handle}`);
      return notFound();
    }

    const { url, width, height, altText: alt } = product.featuredImage || {};
    const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

    return {
      title: product.title,
      description: product.description,
      robots: {
        index: indexable,
        follow: indexable,
        googleBot: {
          index: indexable,
          follow: indexable
        }
      },
      openGraph: url
        ? {
            images: [
              {
                url,
                width,
                height,
                alt
              }
            ]
          }
        : null
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return notFound();
  }
}

export default async function ProductPage({ params }: { params: { handle: string } }) {
  const { handle } = await params;
  try {
    const product = await getProduct(handle);

    if (!product) {
      console.warn(`Product not found for handle: ${params.handle}`);
      return notFound();
    }

    const productJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description,
      image: product.featuredImage.url,
      offers: {
        '@type': 'AggregateOffer',
        availability: product.availableForSale
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        priceCurrency: product.priceRange.maxVariantPrice.currencyCode,
        highPrice: product.priceRange.maxVariantPrice.amount
      }
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productJsonLd)
          }}
        />
        <div className="mx-auto max-w-screen-2xl px-4">
          <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-black md:p-12 lg:flex-row">
            <div className="h-full w-full basis-full lg:basis-4/6">
              <Gallery
                images={product.images!.map((image: Image) => ({
                  src: image.url,
                  altText: image.altText
                }))}
              />
            </div>

            <div className="basis-full lg:basis-2/6">
              <ProductDescriptionWrapper product={product} />
            </div>
          </div>
          <Suspense>
            <RelatedProducts id={product.id!} />
          </Suspense>
        </div>
        <Suspense>
          <Footer />
        </Suspense>
      </>
    );
  } catch (error) {
    console.error('Error rendering product page:', error);
    return notFound();
  }
}

async function RelatedProducts({ id }: { id: string }) {
  // const relatedProducts = await getProductRecommendations(id);
  const relatedProducts: any[] = [];

  if (!relatedProducts.length) return null;

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Related Products</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {relatedProducts.map((product) => (
          <li
            key={product.handle}
            className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
          >
            <Link className="relative h-full w-full" href={`/product/${product.handle}`}>
              <GridTileImage
                alt={product.title}
                label={{
                  title: product.title,
                  amount: product.priceRange.maxVariantPrice.amount,
                  currencyCode: product.priceRange.maxVariantPrice.currencyCode
                }}
                src={product.featuredImage?.url}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
