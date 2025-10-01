import { getServerCategories, getServerCategoryProducts,} from 'lib/medusa/server';
import Link from 'next/link';
import { GridTileImage } from './grid/tile';

export async function Carousel() {
  try {
    // Get all available categories
    const categories = await getServerCategories();
    
    if (!categories || categories.length === 0) {
      console.warn('No categories available for Carousel');
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
    const products = allProductsArrays.flat().filter(Boolean);

    if (!products?.length) {
      console.warn('No products found for Carousel');
      return null;
    }

    const carouselProducts = [...products, ...products, ...products];

  return (
    <div className="w-full overflow-x-auto pb-6 pt-1">
      <ul className="flex animate-carousel gap-4">
        {carouselProducts.map((product, i) => {
          let amount = product.priceRange?.maxVariantPrice?.amount;
          let currencyCode = product.priceRange?.maxVariantPrice?.currencyCode?.toUpperCase();
          if (!amount || amount === "0" || amount === "0.00") {
            const firstVariant = product.variants?.[0];
            const firstPrice = firstVariant?.price;
            if (firstPrice?.amount) {
              amount = firstPrice.amount;
              currencyCode = firstPrice.currencyCode?.toUpperCase() || "USD";
            }
          }

          amount = amount || "0.00";
          currencyCode = currencyCode || "USD";

          return (
            <li
              key={`${product.handle}${i}`}
              className="relative aspect-square h-[30vh] max-h-[275px] w-2/3 max-w-[475px] flex-none md:w-1/3"
            >
              <Link href={`/product/${product.handle}`} className="relative h-full w-full">
                <GridTileImage
                  alt={product.featuredImage?.altText}
                  label={{
                    title: product.title,
                    amount,
                    currencyCode
                  }}
                  src={product.featuredImage?.url}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );} catch (error) {
    console.error('Error in Carousel:', error);
    return null;
  }
}