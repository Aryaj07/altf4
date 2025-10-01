/* eslint-disable no-undef */
'use client';

import Cookies from 'js-cookie';
import {
  Cart,
  MedusaProduct,
  Product
} from './types';
import { reshapeCart, reshapeProduct } from './medusa-utils';

const ENDPOINT = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API ?? 'http://localhost:9000';
const MEDUSA_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY ?? '';

// Client-side cart management
export function getCartId(): string | undefined {
  return Cookies.get('cartId');
}

export function setCartId(cartId: string) {
  Cookies.set('cartId', cartId, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
}

async function clientMedusaRequest({
  method,
  path,
  payload
}: {
  method: string;
  path: string;
  payload?: Record<string, unknown> | undefined;
}) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': MEDUSA_API_KEY
    },
    cache: 'no-store' // For client components, we don't want to cache
  };

  if (payload) {
    options.body = JSON.stringify(payload);
  }

  try {
    const result = await fetch(`${ENDPOINT}/store${path}`, options);
    const body = await result.json();

    if (body.errors) {
      throw body.errors[0];
    }

    return body;
  } catch (e) {
    console.error('Client request error:', e);
    throw e;
  }
}

export async function createClientCart(): Promise<Cart> {
  const response = await clientMedusaRequest({ method: 'POST', path: '/carts' });
  const cart = reshapeCart(response.cart);
  if (cart.id) {
    setCartId(cart.id);
  }
  return cart;
}

export async function getClientCart(cartId: string): Promise<Cart | null> {
  try {
    const response = await clientMedusaRequest({ method: 'GET', path: `/carts/${cartId}` });
    return response.cart ? reshapeCart(response.cart) : null;
  } catch (e) {
    console.error('Error fetching cart:', e);
    return null;
  }
}

export async function addToClientCart(variantId: string, quantity: number = 1) {
  let cartId = getCartId();
  let cart;

  try {
    if (cartId) {
      cart = await getClientCart(cartId);
    }

    if (!cartId || !cart) {
      cart = await createClientCart();
      cartId = cart.id!;
    }

    const response = await clientMedusaRequest({
      method: 'POST',
      path: `/carts/${cartId}/line-items`,
      payload: {
        variant_id: variantId,
        quantity
      }
    });

    return reshapeCart(response.cart);
  } catch (e) {
    console.error('Error adding to cart:', e);
    throw e;
  }
}

export async function getCart(cartId: string | undefined): Promise<Cart | undefined> {
  if (!cartId) {
    return undefined;
  }

  try {
    const result = await clientMedusaRequest({
      method: 'GET',
      path: `/carts/${cartId}`
    });

    if (!result.cart) {
      return undefined;
    }

    return reshapeCart(result.cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return undefined;
  }
}

export async function createCart(): Promise<Cart | undefined> {
  try {
    const result = await clientMedusaRequest({
      method: 'POST',
      path: '/carts'
    });

    if (!result.cart) {
      return undefined;
    }

    const cart = reshapeCart(result.cart);
    if (cart.id) {
      setCartId(cart.id);
    }
    return cart;
  } catch (error) {
    console.error('Error creating cart:', error);
    return undefined;
  }
}

export async function addToCart(
  cartId: string,
  lineItem: { variantId: string; quantity: number }
): Promise<Cart> {
  const res = await clientMedusaRequest({
    method: 'POST',
    path: `/carts/${cartId}/line-items`,
    payload: {
      variant_id: lineItem?.variantId,
      quantity: lineItem?.quantity
    }
  });
  return reshapeCart(res.body.cart);
}

export async function removeFromCart(cartId: string, lineItemId: string): Promise<Cart> {
  const res = await clientMedusaRequest({
    method: 'DELETE',
    path: `/carts/${cartId}/line-items/${lineItemId}`
  });
  return reshapeCart(res.body.cart);
}

export async function updateCart(
  cartId: string,
  { lineItemId, quantity }: { lineItemId: string; quantity: number }
): Promise<Cart> {
  const res = await clientMedusaRequest({
    method: 'POST',
    path: `/carts/${cartId}/line-items/${lineItemId}`,
    payload: {
      quantity
    }
  });
  return reshapeCart(res.body.cart);
}

export async function getClientProducts({
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
    res = await clientMedusaRequest({
      method: 'GET',
      path: `/products?q=${query}&limit=100`
    });
  } else if (categoryId) {
    res = await clientMedusaRequest({
      method: 'GET',
      path: `/products?category_id[]=${categoryId}&limit=100`
    });
  } else {
    res = await clientMedusaRequest({ method: 'GET', path: `/products?limit=100` });
  }

  const products: Product[] = res?.body.products.map((product: MedusaProduct) =>
    reshapeProduct(product)
  );

  if (sortKey === 'PRICE') {
    products.sort((a, b) => {
      const aPrice = parseFloat(a.priceRange.maxVariantPrice.amount);
      const bPrice = parseFloat(b.priceRange.maxVariantPrice.amount);
      return aPrice - bPrice;
    });
  }

  if (sortKey === 'CREATED_AT') {
    products.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  if (reverse) {
    products.reverse();
  }

  return products;
}

export async function updateLineItem(lineItemId: string, quantity: number): Promise<Cart | undefined> {
  const cartId = getCartId();
  if (!cartId) {
    return undefined;
  }

  try {
    const result = await clientMedusaRequest({
      method: 'POST',
      path: `/carts/${cartId}/line-items/${lineItemId}`,
      payload: {
        quantity
      }
    });

    if (!result.cart) {
      return undefined;
    }

    return reshapeCart(result.cart);
  } catch (error) {
    console.error('Error updating cart item:', error);
    return undefined;
  }
}
