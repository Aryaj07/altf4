/* eslint-disable no-undef */
import { isMedusaError } from 'lib/type-guards';

import { TAGS } from 'lib/constants';
import { mapOptionIds } from 'lib/utils';
import { revalidateTag, revalidatePath } from 'next/cache';
import { headers,cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { calculateVariantAmount, computeAmount, convertToDecimal } from './helpers';
import {
  Cart,
  CartItem,
  Image,
  MedusaCart,
  MedusaImage,
  MedusaLineItem,
  MedusaProduct,
  MedusaProductCollection,
  MedusaProductOption,
  MedusaProductVariant,
  Product,
  ProductCategory,
  ProductCollection,
  ProductOption,
  ProductVariant,
  SelectedOption
} from './types';

const ENDPOINT = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API;
const MEDUSA_PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY;

if (!MEDUSA_PUBLISHABLE_API_KEY) {
  console.error('Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY environment variable');
}

export default async function medusaRequest({
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

  if (!MEDUSA_PUBLISHABLE_API_KEY) {
    throw new Error(
      'Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY. Please add it to your environment variables.'
    );
  }

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': MEDUSA_PUBLISHABLE_API_KEY
    },
    cache,
    ...(tags && { next: { tags, revalidate: 60 } })
  };

  if (path.includes('/carts')) {
    options.cache = 'no-cache';
  }
  
  // Ensure products and categories use time-based revalidation
  if (path.includes('/products') || path.includes('/product-categories')) {
    options.next = { ...options.next, revalidate: 60 };
  }

  if (payload) {
    options.body = JSON.stringify(payload);
  }

  try {
    const result = await fetch(`${ENDPOINT}/store${path}`, options);

    if (!result.ok) {
      console.error(`HTTP error! status: ${result.status}`);
      const errorText = await result.text();
      console.error('Error response:', errorText);
      
      // Try to parse error message from response
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP error! status: ${result.status}`);
      } catch (parseError) {
        throw new Error(errorText || `HTTP error! status: ${result.status}`);
      }
    }

    const body = await result.json();

    if (body.errors) {
      console.error('API errors:', body.errors);
      throw body.errors[0];
    }

    return {
      status: result.status,
      body
    };
  } catch (e) {
    if (isMedusaError(e)) {
      console.error('Medusa error:', e);
      throw {
        status: e.status || 500,
        message: e.message
      };
    }

    console.error('Unexpected error:', e);
    throw {
      error: e
    };
  }
}

const reshapeCart = (cart: MedusaCart | null | undefined): Cart | null => {
  if (!cart) {
    return null;
  }

  const lines = cart?.items?.map((item) => reshapeLineItem(item, cart?.region?.currency_code!)) || [];
  const totalQuantity = lines.reduce((a, b) => a + b.quantity, 0);
  const checkoutUrl = '/checkout'; // TODO: implement Medusa checkout flow

  const regionCurrency = cart.region?.currency_code;
  const currencyCode = regionCurrency ? regionCurrency.toUpperCase() : 'USD';

  let subtotalAmount = '0';
  if (cart.subtotal && cart.region) {
    subtotalAmount = computeAmount({
      amount: cart.subtotal,
      region: cart.region,
    }).toString();
  }

  let totalAmount = '0';
  if (cart.total && cart.region) {
    totalAmount = computeAmount({
      amount: cart.total,
      region: cart.region,
    }).toString();
  }

  let totalTaxAmount = '0';
  if (cart.tax_total && cart.region) {
    totalTaxAmount = computeAmount({
      amount: cart.tax_total,
      region: cart.region,
    }).toString();
  }

  const cost = {
    subtotalAmount: {
      amount: subtotalAmount,
      currencyCode,
    },
    totalAmount: {
      amount: totalAmount,
      currencyCode,
    },
    totalTaxAmount: {
      amount: totalTaxAmount,
      currencyCode,
    },
  };

  return {
    ...cart,
    totalQuantity,
    checkoutUrl,
    lines,
    cost,
  };
};


const reshapeLineItem = (lineItem: MedusaLineItem, currency_code: string): CartItem => {
  
  const product = {
    title: lineItem.title,
    priceRange: {
      maxVariantPrice: convertToDecimal(lineItem.quantity * lineItem.unit_price, currency_code)
    },
    updatedAt: lineItem.updated_at,
    createdAt: lineItem.created_at,
    tags: [],
    descriptionHtml: lineItem.description ?? '',
    featuredImage: {
      url: lineItem.thumbnail ?? '',
      altText: lineItem.title ?? ''
    },
    availableForSale: true,
    variants: [lineItem.variant && reshapeProductVariant(lineItem.variant)],
    handle: lineItem.variant?.product?.handle ?? '',
    options: [] as ProductOption[]
  };

  const selectedOptions =
    lineItem.variant?.options?.map((option) => ({
      name: option.option?.title ?? '',
      value: option.value
    })) || [];

  const merchandise = {
    id: lineItem.variant_id || lineItem.id,
    selectedOptions,
    product,
    title: lineItem.description ?? ''
  };

  const cost = {
    totalAmount: {
      amount: convertToDecimal(
        lineItem.total,
        lineItem.variant?.prices?.[0]?.currency_code
      ).toString(),
      currencyCode: lineItem.variant?.prices?.[0]?.currency_code.toUpperCase() || 'EUR'
    }
  };
  const quantity = lineItem.quantity;

  return {
    ...lineItem,
    merchandise: merchandise as any,
    cost,
    quantity
  };
};

const reshapeImages = (images?: MedusaImage[], productTitle?: string): Image[] => {
  if (!images) return [];
  return images.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)![1];
    return {
      ...image,
      altText: `${productTitle} - ${filename}`
    };
  });
};

const reshapeProduct = (product: MedusaProduct): Product => {
  let amount = '0';
  let currencyCode = 'USD';

  // Find the lowest price across all variants
  let minAmount = Infinity;
  for (const v of product.variants || []) {
    const cp = (v as any)?.calculated_price;
    if (cp?.calculated_amount != null && cp.calculated_amount < minAmount) {
      minAmount = cp.calculated_amount;
      currencyCode = cp.currency_code?.toUpperCase() ?? 'USD';
    }
  }
  if (minAmount !== Infinity) {
    amount = convertToDecimal(minAmount, currencyCode).toString();
  }
  const priceRange = {
    maxVariantPrice: {
      amount,
      currencyCode
    }
  };

  const updatedAt = product.updated_at;
  const createdAt = product.created_at;
  const tags = product.tags?.map((tag) => tag.value) || [];
  const descriptionHtml = product.description ?? '';
  const featuredImageFilename = product.thumbnail?.match(/.*\/(.*)\..*/)![1];
  const featuredImage = {
    url: product.thumbnail ?? '',
    altText: product.thumbnail ? `${product.title} - ${featuredImageFilename}` : ''
  };
  // Determine product availability:
  // A variant is available if:
  //   1. It has preorder enabled → available (preorder)
  //   2. It allows backorder → available
  //   3. inventory_quantity > 0 → available (in stock)
  //   4. inventory_quantity === 0 and manage_inventory === true → sold out
  //   5. manage_inventory is false or undefined → available (not tracking)
  const availableForSale = product.variants?.some((v) => {
    const preorder = (v as any)?.preorder_variant;
    // Preorder is only valid if status is enabled AND available_date is in the future
    if (preorder?.status === 'enabled' && preorder.available_date) {
      if (new Date(preorder.available_date) > new Date()) return true;
    }
    if ((v as any)?.allow_backorder === true) return true;
    const qty = (v as any)?.inventory_quantity;
    const managesInventory = (v as any)?.manage_inventory;
    if (managesInventory === true) return typeof qty === 'number' && qty > 0;
    return true;
  }) ?? true;
  const images = reshapeImages(product.images, product.title);

  const variants = product.variants.map((variant) =>
    reshapeProductVariant(variant, product.options)
  );

  let options = [] as ProductOption[];
  product.options && (options = product.options.map((option) => reshapeProductOption(option)));

  return {
    ...product,
    images,
    featuredImage,
    priceRange,
    updatedAt,
    createdAt,
    tags,
    descriptionHtml,
    availableForSale,
    options,
    variants
  };
};

const reshapeProductOption = (productOption: MedusaProductOption): ProductOption => {
  const availableForSale = productOption.product?.variants?.[0]?.purchasable || true;
  const name = productOption.title;
  let values = productOption.values?.map((option) => option.value) || [];
  values = [...new Set(values)];

  return {
    ...productOption,
    availableForSale,
    name,
    values
  };
};

const reshapeProductVariant = (
  productVariant: MedusaProductVariant,
  productOptions?: MedusaProductOption[]
): ProductVariant => {
  let selectedOptions: SelectedOption[] = [];
  if (productOptions && productVariant.options) {
    const optionIdMap = mapOptionIds(productOptions);
    selectedOptions = productVariant.options.map((option) => ({
      name: optionIdMap[option.option_id ?? ''] ?? '',
      value: option.value
    }));
  }
  const availableForSale = productVariant.purchasable || true;
  const price = calculateVariantAmount(productVariant);

  return {
    ...productVariant,
    availableForSale,
    selectedOptions,
    price
  };
};

const reshapeCategory = (category: ProductCategory): ProductCollection => {
  const description = category.description || category.metadata?.description?.toString() || '';
  const seo = {
    title: category?.metadata?.seo_title?.toString() || category.name || '',
    description: category?.metadata?.seo_description?.toString() || category.description || ''
  };
  const path = `/search/${category.handle}`;
  const updatedAt = category.updated_at;
  const title = category.name;
  return {
    ...category,
    description,
    seo,
    title,
    path,
    updatedAt
  };
};

export async function createCart(): Promise<Cart | null> {
  const res = await medusaRequest({ method: 'POST', path: '/carts' });
  return reshapeCart(res.body.cart);
}

export async function addToCart(
  cartId: string,
  lineItem: { variantId: string; quantity: number }
): Promise<Cart | null> {
  const res = await medusaRequest({
    method: 'POST',
    path: `/carts/${cartId}/line-items`,
    payload: {
      variant_id: lineItem?.variantId,
      quantity: lineItem?.quantity
    },
    tags: ['cart']
  });
  return reshapeCart(res.body.cart);
}

export async function removeFromCart(cartId: string, lineItemId: string): Promise<Cart | null> {
  const res = await medusaRequest({
    method: 'DELETE',
    path: `/carts/${cartId}/line-items/${lineItemId}`,
    tags: ['cart']
  });
  return reshapeCart(res.body.cart);
}

export async function updateCart(
  cartId: string,
  { lineItemId, quantity }: { lineItemId: string; quantity: number }
): Promise<Cart | null> {
  const res = await medusaRequest({
    method: 'POST',
    path: `/carts/${cartId}/line-items/${lineItemId}`,
    payload: {
      quantity
    },
    tags: ['cart']
  });
  return reshapeCart(res.body.cart);
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const res = await medusaRequest({ 
    method: 'GET', 
    path: `/carts/${cartId}?fields=*items.variant,*items.variant.preorder_variant`, 
    tags: ['cart'] 
  });
  const cart = res.body.cart;

  if (!cart) {
    return null;
  }

  return reshapeCart(cart);
}

export async function getCategories(): Promise<ProductCollection[]> {
  try {
    const res = await medusaRequest({
      method: 'GET',
      path: '/product-categories',
      tags: ['categories']
    });

    if (!res?.body?.product_categories) {
      console.warn('No product categories found');
      return [];
    }

    // Reshape categories and hide categories starting with 'hidden'
    const categories = res.body.product_categories
      .map((collection: ProductCategory) => reshapeCategory(collection))
      .filter((collection: MedusaProductCollection) => !collection.handle.startsWith('hidden'));

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getCategory(handle: string): Promise<ProductCollection | undefined> {
  try {
    // First, check if the handle exists
    const res = await medusaRequest({
      method: 'GET',
      path: `/product-categories?handle=${handle}`,
      tags: ['categories']
    });

    if (!res?.body?.product_categories?.[0]) {
      console.warn(`No category found with handle: ${handle}`);
      return undefined;
    }

    const category = res.body.product_categories[0];
    
    // Reshape and return the category
    return reshapeCategory(category);
  } catch (error) {
    console.error(`Error fetching category with handle ${handle}:`, error);
    return undefined;
  }
}

export async function getCategoryProducts(
  handle: string,
  reverse?: boolean,
  sortKey?: string
): Promise<Product[]> {
  try {
    // Get cartId from cookies
    const cookieStore = await cookies();
    const cartId = cookieStore.get("cartId")?.value;

    // First get the category details
    const res = await medusaRequest({
      method: 'GET',
      path: `/product-categories?handle=${handle}`,
      tags: ['categories']
    });

    if (!res?.body?.product_categories?.[0]) {
      console.warn(`No category found with handle: ${handle}`);
      return [];
    }

    const category = res.body.product_categories[0];

    // Then get all products in this category
    const productRes = await medusaRequest({
      method: 'GET',
      path: `/products?category_id[]=${category.id}&limit=100&cart_id=${cartId}&fields=+*variants.calculated_price,+*variants.preorder_variant`,
      tags: ['products']
    });

    if (!productRes?.body?.products) {
      return [];
    }

    // Map the products through our reshaper
    const products: Product[] = productRes.body.products.map((product: MedusaProduct) => reshapeProduct(product));

    // Apply sorting if needed
    if (sortKey === 'PRICE') {
      products.sort((a: Product, b: Product) => 
        parseFloat(a.priceRange.maxVariantPrice.amount) - 
        parseFloat(b.priceRange.maxVariantPrice.amount)
      );
    } else if (sortKey === 'CREATED_AT') {
      products.sort((a: Product, b: Product) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    if (reverse) {
      products.reverse();
    }

    return products;
  } catch (error) {
    console.error(`Error fetching products for category ${handle}:`, error);
    return [];
  }
}

function isMedusaProduct(product: unknown): product is MedusaProduct {
  if (!product || typeof product !== 'object') return false;
  return 'id' in product && 'title' in product && 'handle' in product;
}

export async function getProduct(handle: string): Promise<Product | null> {
  try {
    const res = await medusaRequest({
      method: 'GET',
      path: `/products?handle=${handle}&limit=1&fields=+*variants.calculated_price,+*variants.inventory_quantity,+*variants.preorder_variant,+*variants.thumbnail`,
      tags: ['products']
    });

    // Check if the response and products array exist and have items
    if (!res.body?.products || !Array.isArray(res.body.products) || res.body.products.length === 0) {
      console.warn(`No product found with handle: ${handle}`);
      return null;
    }

    const product = res.body.products[0];
    // Validate the product matches our expected type
    if (!isMedusaProduct(product)) {
      console.error('Invalid product data structure received from Medusa API:', product);
      return null;
    }

    return reshapeProduct(product);
  } catch (error) {
    console.error(`Error fetching product with handle ${handle}:`, error);
    return null;
  }
}

export async function getProducts({
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
  let res;

  if (query) {
    res = await medusaRequest({
      method: 'GET',
      path: `/products?q=${query}&limit=100&fields=+*variants.calculated_price,+*variants.preorder_variant,+*variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder`,
      tags: ['products']
    });
  } else if (categoryId) {
    res = await medusaRequest({
      method: 'GET',
      path: `/products?category_id[]=${categoryId}&limit=100&fields=+*variants.calculated_price,+*variants.preorder_variant,+*variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder`,
      tags: ['products']
    });
  } else {
    res = await medusaRequest({ method: 'GET', path: `/products?limit=100&fields=+*variants.calculated_price,+*variants.preorder_variant,+*variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder`, tags: ['products'] });
  }

  if (!res) {
    console.error("Couldn't fetch products");
    return [];
  }

  if (!res?.body?.products) {
    return [];
  }
  
  const products: Product[] = res.body.products.map((product: MedusaProduct) =>
    reshapeProduct(product)
  );
  
  sortKey === 'PRICE' &&
    products.sort(
      (a, b) =>
        parseFloat(a.priceRange.maxVariantPrice.amount) -
        parseFloat(b.priceRange.maxVariantPrice.amount)
    );

  sortKey === 'CREATED_AT' &&
    products.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  reverse && products.reverse();

  return products;
}

export async function getMenu(menu: string): Promise<any[]> {
  if (menu === 'next-js-frontend-header-menu') {
    const categories = await getCategories();
    return categories.map((cat) => ({
      title: cat.title,
      path: cat.path
    }));
  }

  if (menu === 'next-js-frontend-footer-menu') {
    return [
      { title: 'About Medusa', path: 'https://medusajs.com/' },
      { title: 'Medusa Docs', path: 'https://docs.medusajs.com/' },
      { title: 'Medusa Blog', path: 'https://medusajs.com/blog' }
    ];
  }

  return [];
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Medusa,
  // otherwise it will continue to retry the request.
  const collectionWebhooks = [
    'product-category.created', 
    'product-category.updated', 
    'product-category.deleted'
  ];
  const productWebhooks = [
    'product.created', 
    'product.updated', 
    'product.deleted',
    'product-variant.created',
    'product-variant.updated',
    'product-variant.deleted'
  ];
  
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
    console.log(`Webhook received for unhandled topic: ${topic}`);
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    console.log(`Revalidating categories for topic: ${topic}`);
    revalidateTag(TAGS.categories);
    // Revalidate all category pages
    revalidatePath('/search/[slug]', 'page');
    revalidatePath('/', 'page');
  }

  if (isProductUpdate) {
    console.log(`Revalidating products for topic: ${topic}`);
    revalidateTag(TAGS.products);
    // Revalidate all product pages and homepage
    revalidatePath('/product/[slug]', 'page');
    revalidatePath('/search/[slug]', 'page');
    revalidatePath('/', 'page');
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    // Get all products, limiting to a reasonable number for featured items
    const res = await medusaRequest({
      method: 'GET',
      path: '/products?limit=20',
      tags: ['products']
    });

    if (!res?.body?.products || !Array.isArray(res.body.products)) {
      return [];
    }

    // Filter and sort products as needed
    const products = res.body.products
      .filter((p: any) => p.status === 'published' && p.variants?.length > 0)
      .map(reshapeProduct);

    return products;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export async function getProductDescriptionSections(productId: string): Promise<any[]> {
  try {
    const res = await medusaRequest({
      method: 'GET',
      path: `/product-description-sections?product_id=${productId}`,
      tags: ['product-descriptions'],
      cache: 'no-cache'
    });

    if (!res?.body?.sections || !Array.isArray(res.body.sections)) {
      return [];
    }

    return res.body.sections;
  } catch (error) {
    console.error('Error fetching product description sections:', error);
    return [];
  }
}