import { getCategory, getCategoryProducts } from 'lib/medusa';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Grid from 'components/grid';
import ProductGridItems from 'components/layout/product-grid-items';
import { defaultSort, sorting } from 'lib/constants';

export const runtime = 'edge';

export async function generateMetadata({
  params
}: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  const categoryData = await getCategory(collection);

  if (!categoryData) return notFound();

  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  
  const title = categoryData.seo?.title || `${categoryData.title} - Gaming Gear | Altf4`;
  const description = categoryData.seo?.description || categoryData.description || `Shop ${categoryData.title} products at Altf4. Premium gaming peripherals with fast shipping across India.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/search/${collection}`
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/search/${collection}`,
      type: 'website',
      images: categoryData.metadata?.image ? [{ url: categoryData.metadata.image as string }] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  };
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { collection } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { sort } = resolvedSearchParams as { [key: string]: string };
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;
  const products = await getCategoryProducts(collection, reverse, sortKey);
  
  return (
    <section>
      {products.length === 0 ? (
        <p className="py-3 text-lg">{`No products found in this collection`}</p>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      )}
    </section>
  );
}