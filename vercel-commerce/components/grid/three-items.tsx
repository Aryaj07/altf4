import { GridTileImage } from 'components/grid/tile';
import { getServerCategories, getServerCategoryProducts } from 'lib/medusa/server';
import type { Product } from 'lib/medusa/types';
import Link from 'next/link';

function ThreeItemGridItem({
  item,
  size,
  priority
}: {
  item: Product;
  size: 'full' | 'half';
  priority?: boolean;
}) {
  return (
    <div
      className={size === 'full' ? 'md:col-span-4 md:row-span-2' : 'md:col-span-2 md:row-span-1'}
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
            position: size === 'full' ? 'bottom' : 'bottom',
            title: item.title as string,
            amount: item.priceRange.maxVariantPrice.amount,
            currencyCode: item.priceRange.maxVariantPrice.currencyCode
          }}
        />
      </Link>
    </div>
  );
}

export async function ThreeItemGrid() {
  try {
    // Get all available categories
    const categories = await getServerCategories();
    
    if (!categories || categories.length === 0) {
      console.warn('No categories available for ThreeItemGrid');
      return null;
    }

    // Fetch products from all categories
    const allProductsPromises = categories.map(async (category) => {
      try {
        return await getServerCategoryProducts(category.handle);
      } catch (error) {
        console.error(`Error fetching products for category ${category.handle}:`, error);
        return [];
      }
    });

    const allProductsArrays = await Promise.all(allProductsPromises);

    // Flatten the array of arrays and remove any empty arrays
    const allProducts = allProductsArrays.flat().filter(Boolean);

    // Get the first three products
    const [firstProduct, secondProduct, thirdProduct] = allProducts;

    if (!firstProduct || !secondProduct || !thirdProduct) {
      console.warn('Not enough products found for ThreeItemGrid');
      return null;
    }

    return (
      <section className="mx-auto grid max-w-screen-2xl gap-4 px-4 pb-4 md:grid-cols-6 md:grid-rows-2 lg:max-h-[calc(100vh-200px)]">
        <ThreeItemGridItem size="full" item={firstProduct} priority={true} />
        <ThreeItemGridItem size="half" item={secondProduct} priority={true} />
        <ThreeItemGridItem size="half" item={thirdProduct} />
      </section>
    );
  } catch (error) {
    console.error('Error in ThreeItemGrid:', error);
    return null;
  }
}
