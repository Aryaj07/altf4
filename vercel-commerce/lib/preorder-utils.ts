import { Product, ProductVariant, StoreProductVariantWithPreorder } from './medusa/types';
import { isPreorder as checkIsPreorder } from './medusa/utils';

/**
 * Check if a specific variant has preorder enabled
 */
export function isVariantPreorder(variant: ProductVariant | undefined): boolean {
  if (!variant) return false;
  return checkIsPreorder((variant as StoreProductVariantWithPreorder)?.preorder_variant);
}

/**
 * Check if any variant in the product has preorder enabled
 */
export function hasAnyPreorderVariant(product: Product): boolean {
  if (!product.variants || product.variants.length === 0) return false;
  
  return product.variants.some(variant => 
    checkIsPreorder((variant as StoreProductVariantWithPreorder)?.preorder_variant)
  );
}

/**
 * Check if the product is available for preorder
 * Returns true if the product has variants with preorder enabled
 */
export function isProductPreorderAvailable(product: Product): boolean {
  return hasAnyPreorderVariant(product);
}

/**
 * Check if a variant is in stock
 */
export function isVariantInStock(variant: ProductVariant | undefined): boolean {
  if (!variant) return false;
  
  const stockQuantity = (variant as any)?.inventory_quantity;
  return typeof stockQuantity === 'number' ? stockQuantity > 0 : false;
}

/**
 * Get the stock quantity for a variant
 */
export function getVariantStockQuantity(variant: ProductVariant | undefined): number {
  if (!variant) return 0;
  
  const stockQuantity = (variant as any)?.inventory_quantity;
  return typeof stockQuantity === 'number' ? stockQuantity : 0;
}

/**
 * Check if the product has variants
 */
export function hasVariants(product: Product): boolean {
  return Boolean(product.variants && product.variants.length > 0);
}

/**
 * Check if the product has multiple options (more than just default)
 */
export function hasMultipleOptions(product: Product): boolean {
  const options = product.options || [];
  return options.length > 1 || (options.length === 1 && options[0]?.values.length > 1);
}
