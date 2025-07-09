'use client';

import { Product } from 'lib/medusa/types';
import { useCart } from 'components/cart/cart-context';
import { ProductDescription } from './product-description';

export function ProductDescriptionWrapper({ product }: { product: Product }) {
  const { refreshCart } = useCart();

  return <ProductDescription product={product} onCartUpdate={refreshCart} />;
}
