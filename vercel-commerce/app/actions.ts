'use server'

import { cookies } from 'next/headers';
import { addToCart, createCart, getCart, removeFromCart, updateCart } from 'lib/medusa';

export async function addToCartAction(variantId: string | undefined) {
  if (!variantId) {
    throw new Error('Missing product variant ID');
  }

  try {
    const cookieStore = cookies();
    let cartId = cookieStore.get('cartId')?.value;
    let cart;

    if (cartId) {
      cart = await getCart(cartId);
    }

    if (!cartId || !cart) {
      cart = await createCart();
      cartId = cart.id!;
      cookieStore.set('cartId', cartId);
    }

    await addToCart(cartId, { variantId, quantity: 1 });
    return { status: 'success', cartId };
  } catch (e) {
    return { status: 'error', message: 'Error adding item to cart' };
  }
}

export async function removeFromCartAction(cartId: string, lineItemId: string) {
  try {
    await removeFromCart(cartId, lineItemId);
    return { status: 'success' };
  } catch (e) {
    return { status: 'error', message: 'Error removing item from cart' };
  }
}

export async function updateCartAction(cartId: string, lineItemId: string, quantity: number) {
  try {
    await updateCart(cartId, { lineItemId, quantity });
    return { status: 'success' };
  } catch (e) {
    return { status: 'error', message: 'Error updating cart' };
  }
}
