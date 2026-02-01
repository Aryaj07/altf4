'use client';

import { Product, ProductVariant } from 'lib/medusa/types';
import { useCart } from 'components/cart/cart-context';
import { ProductDescription } from './product-description';

export function ProductDescriptionWrapper({ 
  product,
  onVariantChange 
}: { 
  product: Product;
  onVariantChange?: (_variant: ProductVariant | undefined) => void;
}) {
  const { refreshCart } = useCart();

  return (
    <ProductDescription 
      product={product} 
      onCartUpdate={refreshCart}
      onVariantChange={onVariantChange}
    />
  );
}
