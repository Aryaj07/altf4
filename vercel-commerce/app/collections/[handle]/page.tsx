import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Grid from 'components/grid';
import ProductGridItems from 'components/layout/product-grid-items';
import Footer from 'components/layout/footer';
import { getServerCollectionByHandle, getServerCollectionProducts } from 'lib/medusa/server';
import { defaultSort, sorting } from 'lib/constants';
import { getProductRatings } from 'lib/review-utils';
import { Suspense } from 'react';



export async function generateMetadata({
  params
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);
  const collection = await getServerCollectionByHandle(handle);

  if (!collection) return notFound();

  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  const title = `${collection.title} | Altf4`;
  const description = `Shop ${collection.title} products at Altf4. Premium gaming peripherals with fast shipping across India.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/collections/${handle}`
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/collections/${handle}`,
      type: 'website'
    }
  };
}

export default async function CollectionPage({
  params,
  searchParams
}: {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { sort } = resolvedSearchParams as { [key: string]: string };
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;

  const collection = await getServerCollectionByHandle(handle);

  if (!collection) return notFound();

  const products = await getServerCollectionProducts(collection.id);

  // Apply sorting
  if (sortKey === 'PRICE') {
    products.sort(
      (a, b) =>
        parseFloat(a.priceRange.maxVariantPrice.amount) -
        parseFloat(b.priceRange.maxVariantPrice.amount)
    );
  } else if (sortKey === 'CREATED_AT') {
    products.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  if (reverse) {
    products.reverse();
  }

  // Fetch ratings for all products
  const productIds = products.map((p) => p.id).filter(Boolean) as string[];
  const ratings = await getProductRatings(productIds);

  return (
    <Suspense>
      <div className="mx-auto max-w-screen-2xl px-4 pb-4">
        {/* Collection header */}
        <div className="mb-8 pt-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">{collection.title}</h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        {products.length === 0 ? (
          <p className="py-3 text-lg">No products found in this collection.</p>
        ) : (
          <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <ProductGridItems products={products} ratings={ratings} />
          </Grid>
        )}
      </div>
      <Footer />
    </Suspense>
  );
}
