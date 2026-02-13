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
  // Default to true if no inventory data (product doesn't track inventory)
  return typeof stockQuantity === 'number' ? stockQuantity > 0 : true;
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
  if (options.length > 1) return true;

  if (options.length === 1) {
    const firstOption = options[0];
    if (!firstOption || !Array.isArray(firstOption.values)) return false;
    return firstOption.values.length > 1;
  }

  return false;
}

/**
 * Check if a product is truly sold out (not available AND not preorder)
 */
export function isProductSoldOut(product: Product): boolean {
  return !product.availableForSale && !hasAnyPreorderVariant(product);
}

/**
 * Get the estimated arrival date for a preorder variant
 */
export function getPreorderETA(variant: ProductVariant | undefined): Date | null {
  if (!variant) return null;
  
  const preorderVariant = (variant as StoreProductVariantWithPreorder)?.preorder_variant;
  if (!preorderVariant || !checkIsPreorder(preorderVariant)) return null;
  
  // Get the available_date from preorder_variant
  const availableDate = (preorderVariant as any).available_date;
  if (!availableDate) return null;
  
  return new Date(availableDate);
}

/**
 * Format the ETA date for display
 */
export function formatPreorderETA(date: Date | null): string {
  if (!date) return '';
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('en-US', options);
}
