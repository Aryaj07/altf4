/* eslint-disable no-undef */
'use server';

import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import {
  MedusaProduct,
  MedusaProductCollection,
  Product,
  ProductCategory,
  ProductCollection
} from './types';
import { reshapeProduct, reshapeCategory } from './utils';
import { isMedusaError } from '../type-guards';
import { TAGS } from './server-constants';

// Use environment variables directly
const MEDUSA_API_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API;
const MEDUSA_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || '';

export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Medusa,
  // otherwise it will continue to retry the request.
  const collectionWebhooks = ['categories/create', 'categories/delete', 'categories/update'];
  const productWebhooks = ['products/create', 'products/delete', 'products/update'];
  const topic = (await headers()).get('x-medusa-topic') || 'unknown';
  const secret = req.nextUrl.searchParams.get('secret');
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);

  if (!secret || secret !== process.env.MEDUSA_REVALIDATION_SECRET) {
    console.error('Invalid revalidation secret.');
    return NextResponse.json({ status: 200 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    // We don't need to revalidate anything for any other topics.
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.categories);
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products);
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}

export async function serverMedusaRequest({
  cache = 'force-cache',
  method,
  path,
  payload,
  tags
}: {
  cache?: RequestCache;
  method: string;
  path: string;
  payload?: Record<string, unknown> | undefined;
  tags?: string[];
}) {
  const fullUrl = `${MEDUSA_API_URL}/store${path}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': MEDUSA_API_KEY
    },
    cache,
    ...(tags && { next: { tags } })
  };

  if (path.includes('/carts')) {
    options.cache = 'no-cache';
  }

  if (payload) {
    options.body = JSON.stringify(payload);
  }

  try {
    const result = await fetch(fullUrl, options);
    
    if (!result.ok) {
      const errorText = await result.text();
      console.error(`API Error: ${result.status} - ${errorText}`);
      return null;
    }

    const body = await result.json();

    if (body.errors) {
      throw body.errors[0];
    }

    return {
      status: result.status,
      body
    };
  } catch (e: any) {
    console.error('serverMedusaRequest error:', e);
    if (isMedusaError(e)) {
      throw {
        status: e.status || 500,
        message: e.message
      };
    }

    throw {
      error: e
    };
  }
}

export async function getServerMenu(menu: string): Promise<{ title: string; path: string }[]> {
  // This part is DYNAMIC - it fetches categories for the header
  if (menu === 'next-js-frontend-header-menu') {
    try {
      const res = await serverMedusaRequest({
        method: 'GET',
        path: '/product-categories',
        tags: ['categories']
      });

      if (!res?.body?.product_categories) {
        console.warn('No product_categories found in response:', res?.body);
        return [];
      }

      const categories = res.body.product_categories
        .map((collection: ProductCategory) => reshapeCategory(collection))
        .filter((collection: MedusaProductCollection) => !collection.handle.startsWith('hidden'));

      return categories.map((cat: ProductCollection) => ({
        title: cat.title,
        path: cat.path
      }));
    } catch (error) {
      console.error('Error fetching categories for menu:', error);
      return [];
    }
  }

  // This part is STATIC - you manually define the footer links here
  if (menu === 'next-js-frontend-footer-menu') {
    const siteUrl = process.env.NEXT_PUBLIC_VERCEL_URL || '';

    return [
      { title: 'Privacy Policy', path: `${siteUrl}/privacy` },
      { title: 'Terms & Conditions', path: `${siteUrl}/terms-and-condition` },
      { title: 'Returns', path: `${siteUrl}/returns` },
      { title: 'Shipping', path: `${siteUrl}/shipping-policy`},
      { title: 'Contact', path: `${siteUrl}/contact`}
    ];
  }
  return [];
}

export async function getServerCategories(): Promise<ProductCollection[]> {
  try {
    const res = await serverMedusaRequest({
      method: 'GET',
      path: '/product-categories',
      tags: ['categories']
    });

    if (!res?.body?.product_categories) {
      console.warn('No product_categories found in response:', res?.body);
      return [];
    }

    // Reshape categories and hide categories starting with 'hidden'
    return res.body.product_categories
      .map((collection: ProductCategory) => reshapeCategory(collection))
      .filter((collection: MedusaProductCollection) => !collection.handle.startsWith('hidden'));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Remove duplicate getMenu function - use getServerMenu instead
export async function getMenu(menu: string): Promise<{ title: string; path: string }[]> {
  return getServerMenu(menu);
}

export async function getServerCategoryProducts(
  handle: string,
  reverse?: boolean,
  sortKey?: string
): Promise<Product[]> {
  try {
    const res = await serverMedusaRequest({
      method: 'GET',
      path: `/product-categories?handle=${handle}`,
      tags: ['categories']
    });

    if (!res?.body?.product_categories?.[0]?.id) {
      console.warn(`No category found for handle: ${handle}`);
      return [];
    }

    const category = res.body.product_categories[0];
    return await getServerProducts({ reverse, sortKey, categoryId: category.id });
  } catch (error) {
    console.error(`Error fetching category products for handle ${handle}:`, error);
    return [];
  }
}

export async function getServerProducts({
  query,
  reverse,
  sortKey,
  categoryId
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
  categoryId?: string;
}): Promise<Product[]> {
  try {
    // Get region info for proper pricing
    const regionRes = await serverMedusaRequest({
      method: 'GET',
      path: '/regions',
      tags: ['regions']
    });
    
    const regionId = regionRes?.body?.regions?.[0]?.id;

    // Construct the path with region_id
    let path = `/products?limit=100&fields=+*variants.prices`;
    if (regionId) {
      path += `&region_id=${regionId}`;
    }
    if (query) {
      path += `&q=${query}`;
    }
    if (categoryId) {
      path += `&category_id[]=${categoryId}`;
    }

    const productsRes = await serverMedusaRequest({ 
      method: 'GET', 
      path, 
      tags: ['products'] 
    });

    if (!productsRes?.body?.products) {
      return [];
    }

    const products = productsRes.body.products.map((product: MedusaProduct) => 
      reshapeProduct(product)
    );

    sortKey === 'PRICE' &&
      products.sort(
        (a: Product, b: Product) =>
          parseFloat(a.priceRange.maxVariantPrice.amount) -
          parseFloat(b.priceRange.maxVariantPrice.amount)
      );

    sortKey === 'CREATED_AT' &&
      products.sort((a: Product, b: Product) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    reverse && products.reverse();

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getServerCategory(handle: string): Promise<ProductCollection | undefined> {
  try {
    const res = await serverMedusaRequest({
      method: 'GET',
      path: `/product-categories?handle=${handle}`,
      tags: ['categories']
    });

    if (!res?.body?.product_categories?.length) {
      console.warn(`No category found for handle: ${handle}`);
      return undefined;
    }

    return reshapeCategory(res.body.product_categories[0]);
  } catch (error) {
    console.error(`Error fetching category for handle ${handle}:`, error);
    return undefined;
  }
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  try {
    // Get region info for proper pricing
    const regionRes = await serverMedusaRequest({
      method: 'GET',
      path: '/regions',
      tags: ['regions']
    });
    
    const regionId = regionRes?.body?.regions?.[0]?.id;
    
    // Use serverMedusaRequest instead of direct fetch
    let path = `/products?handle=${handle}`;
    if (regionId) {
      path += `&region_id=${regionId}`;
    }

    const res = await serverMedusaRequest({
      method: 'GET',
      path,
      tags: [TAGS.products]
    });

    if (!res?.body?.products?.length) {
      return undefined;
    }

    const product = res.body.products[0] as MedusaProduct;
    return reshapeProduct(product);
  } catch (error) {
    console.error('Error in getProduct:', error);
    if (isMedusaError(error)) {
      throw new Error(`Medusa error: ${error.message}`);
    }
    throw error;
  }
}