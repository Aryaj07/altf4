import { getServerCollections, getServerCollectionProducts } from 'lib/medusa/server';
import type { Product } from 'lib/medusa/types';
import type { MedusaStoreCollection } from 'lib/medusa/types';
import Image from 'next/image';
import Link from 'next/link';

type CollectionWithProducts = {
  collection: MedusaStoreCollection;
  products: Product[];
  productCount: number;
  featuredImage: string | null;
};

export async function CollectionShowcase() {
  try {
    const collections = await getServerCollections();

    if (!collections || collections.length === 0) {
      return null;
    }

    // Fetch products for each collection in parallel
    const collectionsWithProducts: CollectionWithProducts[] = (
      await Promise.all(
        collections.map(async (col) => {
          try {
            const products = await getServerCollectionProducts(col.id);
            return {
              collection: col,
              products,
              productCount: products.length,
              featuredImage: products[0]?.featuredImage?.url || null
            };
          } catch {
            return null;
          }
        })
      )
    ).filter((c): c is CollectionWithProducts => c !== null && c.productCount > 0);

    if (collectionsWithProducts.length === 0) return null;

    return (
      <section className="mx-auto max-w-screen-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white md:text-3xl">
            Best Selling Collections
          </h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Shop our most popular gaming collections
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collectionsWithProducts.map(({ collection, productCount, featuredImage }) => (
            <Link
              key={collection.id}
              href={`/collections/${encodeURIComponent(collection.handle)}`}
              className="group relative flex h-[280px] flex-col justify-end overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 transition-all duration-300 hover:border-blue-500 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
            >
              {/* Background product image */}
              {featuredImage && (
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="relative h-full w-full">
                    <Image
                      src={featuredImage}
                      alt={collection.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Text content */}
              <div className="relative z-10 p-5">
                <h3 className="text-lg font-bold text-white">
                  {collection.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-300">
                  {productCount} {productCount === 1 ? 'product' : 'products'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  } catch (error) {
    console.error('Error in CollectionShowcase:', error);
    return null;
  }
}
