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
import Reviews from '@/components/review/review';
// import AddReview from '@/components/review/add-review';
import SummaryReview from '@/components/review/summary-review';
import { sdkReview } from "@/lib/sdk/sdk-review";
import { Breadcrumb } from 'components/product/breadcrumb';

export const runtime = 'edge';

// Helper function to get review stats for structured data
async function getReviewStats(productId: string): Promise<any | null> {
  try {
    const res = await sdkReview.store.productReviews.listStats({
      product_id: productId,
      offset: 0,
      limit: 100,
    });
    if (res && (res as any).product_review_stats && (res as any).product_review_stats.length > 0) {
      return (res as any).product_review_stats[0];
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch review stats for structured data", err);
    return null;
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  try {

    const product = await getProduct(handle);

    if (!product) {
      console.warn(`Product not found for handle: ${handle}`);
      return notFound();
    }

    const { url, width, height, altText: alt } = product.featuredImage || {};
    const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);
    
    // Strip HTML tags from description for meta tags
    const cleanDescription = product.description
      ? product.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      : product.title;
    
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
    const productUrl = `${baseUrl}/product/${product.handle}`;

    return {
      title: product.title,
      description: cleanDescription,
      alternates: {
        canonical: productUrl
      },
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
            title: product.title,
            description: cleanDescription,
            url: productUrl,
            images: [
              {
                url,
                width,
                height,
                alt
              }
            ]
          }
        : null,
      twitter: {
        card: 'summary_large_image',
        title: product.title,
        description: cleanDescription,
        images: url ? [url] : undefined
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return notFound();
  }
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  try {
    const product = await getProduct(handle);

    if (!product) {
      console.warn(`Product not found for handle: ${handle}`);
      return notFound();
    }

    // Fetch review stats for structured data
    const reviewStats = await getReviewStats(product.id!);

    // Build comprehensive Schema.org Product structured data
    const productJsonLd: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description || product.title,
      image: product.images?.map(img => img.url) || [product.featuredImage.url],
      sku: product.variants?.[0]?.sku || undefined,
      brand: {
        '@type': 'Brand',
        name: 'Altf4'
      },
      offers: {
        '@type': 'Offer',
        url: `${process.env.NEXT_PUBLIC_VERCEL_URL}/product/${product.handle}`,
        priceCurrency: product.priceRange.maxVariantPrice.currencyCode,
        price: product.priceRange.maxVariantPrice.amount,
        lowPrice: product.variants?.[0]?.prices?.[0]?.amount || product.priceRange.maxVariantPrice.amount,
        availability: product.availableForSale
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        itemCondition: 'https://schema.org/NewCondition',
        seller: {
          '@type': 'Organization',
          name: 'Altf4'
        }
      }
    };

    // Add aggregate rating if reviews exist
    if (reviewStats && reviewStats.review_count > 0 && reviewStats.average_rating) {
      productJsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: reviewStats.average_rating.toFixed(1),
        reviewCount: reviewStats.review_count,
        bestRating: '5',
        worstRating: '1'
      };
    }

    // Add review if we have at least one review
    if (reviewStats && reviewStats.review_count > 0) {
      productJsonLd.review = {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: reviewStats.average_rating?.toFixed(1) || '5',
          bestRating: '5'
        },
        author: {
          '@type': 'Person',
          name: 'Verified Customer'
        }
      };
    }

    // Build BreadcrumbList structured data
    const breadcrumbItems: any[] = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: process.env.NEXT_PUBLIC_VERCEL_URL
      }
    ];

    // Add category breadcrumbs if product has categories
    if (product.categories && product.categories.length > 0) {
      const category = product.categories[0]; // Use first category
      let position = 2;

      // Build category hierarchy (if parent categories exist)
      const categoryPath: any[] = [];
      let currentCategory = category;
      
      // Traverse up the category tree
      while (currentCategory) {
        categoryPath.unshift(currentCategory);
        currentCategory = currentCategory.parent_category as any;
      }

      // Add each category level to breadcrumb
      categoryPath.forEach((cat) => {
        breadcrumbItems.push({
          '@type': 'ListItem',
          position: position++,
          name: cat.name,
          item: `${process.env.NEXT_PUBLIC_VERCEL_URL}/search/${cat.handle}`
        });
      });

      // Add product as final breadcrumb
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: position,
        name: product.title,
        item: `${process.env.NEXT_PUBLIC_VERCEL_URL}/product/${product.handle}`
      });
    } else {
      // If no categories, just add product after home
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 2,
        name: product.title,
        item: `${process.env.NEXT_PUBLIC_VERCEL_URL}/product/${product.handle}`
      });
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd),
          }}
        />
        <div className="mx-auto max-w-screen-2xl px-4">
          <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-black md:p-12 lg:flex-row lg:flex-wrap">
            
            {/* Breadcrumb Navigation */}
            <div className="basis-full">
              <Breadcrumb items={breadcrumbItems.map(item => ({
                name: item.name,
                href: item.item
              }))} />
            </div>

            {/* Left column: Gallery */}
            <div className="h-full w-full basis-full lg:basis-4/6">
              <Gallery
                images={product.images!.map((image: Image) => ({
                  src: image.url,
                  altText: image.altText,
                }))}
              />
            </div>

            {/* Right column: Product description */}
            <div className="basis-full lg:basis-2/6">
              <ProductDescriptionWrapper product={product} />
            </div>

            {/* Full width row: Reviews & Summary */}
            <div className="basis-full mt-10">
              <div className="rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-black">
                <h2 className="text-xl font-semibold mb-6">Customer Reviews</h2>

                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left side: Review summary */}
                  <div className="lg:w-1/3">
                    <SummaryReview productId={product.id!} />
                  </div>

                  {/* Right side: Individual reviews */}
                  <div className="lg:w-2/3 space-y-8">
                    {/* Example review */}
                    <div className="pb-4">
                      <Reviews productId={product.id!} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          <div className="mt-12">
            <Suspense>
              <RelatedProducts id={product.id!} />
            </Suspense>
          </div>
        </div>

        {/* Footer */}
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

// eslint-disable-next-line no-unused-vars
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