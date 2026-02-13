import { getServerCategories, getServerCategoryProducts } from 'lib/medusa/server';
import type { Product } from 'lib/medusa/types';
import { getProductRatings, type ProductRatingsMap } from 'lib/review-utils';
import { hasAnyPreorderVariant } from 'lib/preorder-utils';
import RotatingThreeItemGrid from './rotating-three-items';

function serializeProduct(p: Product) {
  return {
    id: p.id || '',
    handle: p.handle || '',
    title: p.title,
    featuredImage: { url: p.featuredImage.url, altText: p.featuredImage.altText },
    priceRange: {
      maxVariantPrice: {
        amount: p.priceRange.maxVariantPrice.amount,
        currencyCode: p.priceRange.maxVariantPrice.currencyCode,
      },
    },
    isPreorder: hasAnyPreorderVariant(p),
  };
}

export async function ThreeItemGrid() {
  try {
    const categories = await getServerCategories();

    if (!categories || categories.length === 0) {
      return null;
    }

    const sortedCategories = categories.sort((a, b) => {
      const rankA = (a as any).rank ?? 999;
      const rankB = (b as any).rank ?? 999;
      return rankA - rankB;
    });

    // Fetch ALL products from each category
    const categoryProducts: Product[][] = [];

    for (const category of sortedCategories) {
      try {
        const products = await getServerCategoryProducts(category.handle);
        if (products && products.length > 0) {
          categoryProducts.push(products);
        }
      } catch (error) {
        console.error(`Error fetching products for category ${category.handle}:`, error);
        continue;
      }
    }

    if (categoryProducts.length < 3) {
      // Not enough categories, can't form a 3-item grid
      return null;
    }

    // Build product groups: pick one product from each of the top 3 categories per group
    // Rotate through all products in each category
    const [cat1, cat2, cat3] = categoryProducts;
    if (!cat1?.length || !cat2?.length || !cat3?.length) return null;

    const maxGroups = Math.max(cat1.length, cat2.length, cat3.length);
    const groups: [Product, Product, Product][] = [];

    for (let i = 0; i < maxGroups; i++) {
      groups.push([
        cat1[i % cat1.length]!,
        cat2[i % cat2.length]!,
        cat3[i % cat3.length]!,
      ]);
    }

    // Collect all unique product IDs for ratings
    const allProductIds = new Set<string>();
    groups.forEach(([a, b, c]) => {
      if (a.id) allProductIds.add(a.id);
      if (b.id) allProductIds.add(b.id);
      if (c.id) allProductIds.add(c.id);
    });

    const ratings = await getProductRatings([...allProductIds]);

    // Serialize products for client component
    const serializedGroups = groups.map(
      ([a, b, c]) =>
        [serializeProduct(a), serializeProduct(b), serializeProduct(c)] as [
          ReturnType<typeof serializeProduct>,
          ReturnType<typeof serializeProduct>,
          ReturnType<typeof serializeProduct>,
        ]
    );

    return (
      <RotatingThreeItemGrid
        productGroups={serializedGroups}
        ratings={ratings}
        intervalMs={5000}
      />
    );
  } catch (error) {
    console.error('Error in ThreeItemGrid:', error);
    return null;
  }
}
