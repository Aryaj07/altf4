'use client';

import { Product } from 'lib/medusa/types';
import { getCart, getCartId } from 'lib/medusa/client';
import { useState, useCallback } from 'react';
import { ProductDescription } from './product-description';

export function ProductDescriptionWrapper({ product }: { product: Product }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const refreshCart = useCallback(async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const cartId = getCartId();
      if (cartId) {
        await getCart(cartId);
      }
    } catch (error) {
      console.error('Error refreshing cart:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating]);

  return <ProductDescription product={product} onCartUpdate={refreshCart} />;
}
