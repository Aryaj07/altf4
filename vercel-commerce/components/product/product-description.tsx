import { useState } from 'react';
import { AddToCart } from 'components/cart/add-to-cart';
import Price from 'components/price-new';
import Prose from 'components/prose';
import { Product, ProductVariant } from 'lib/medusa/types';
import { VariantSelector } from './variant-selector';
import {
  isVariantPreorder,
  isProductPreorderAvailable,
  isVariantInStock,
  getVariantStockQuantity,
  hasMultipleOptions
} from 'lib/preorder-utils';

export function ProductDescription({ 
  product,
  onCartUpdate
}: { 
  product: Product;
  onCartUpdate: () => Promise<void>;
}) {
  // Track the selected variant - auto-select for single variant or no options
  const shouldAutoSelect = !hasMultipleOptions(product);
  const initialVariant = shouldAutoSelect && product.variants && product.variants.length > 0 
    ? product.variants[0] 
    : undefined;
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(initialVariant);

  // Check if product is available for preorder
  const productHasPreorder = isProductPreorderAvailable(product);
  
  // Check if selected variant is preorder (or initial variant if no selection yet)
  const variantToCheck = selectedVariant || initialVariant;
  const isSelectedVariantPreorder = isVariantPreorder(variantToCheck);
  
  // Get stock information for selected variant
  const selectedStock = getVariantStockQuantity(variantToCheck);
  const inStock = isVariantInStock(variantToCheck);

  // Use selected variant's price if available, else fallback to product priceRange
  const price = (selectedVariant as any)?.calculated_price?.calculated_amount || product.priceRange.maxVariantPrice.amount;
  const currencyCode = (selectedVariant as any)?.calculated_price?.currencyCode || product.priceRange.maxVariantPrice.currencyCode;


  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-5xl font-medium">{product.title}</h1>
        <div className="flex items-center gap-3">
          <div className="mr-auto w-auto rounded-full bg-blue-600 p-2 text-sm text-white">
            <Price
              amount={price}
              currencyCode={currencyCode}
              showCurrency={false}
            />
          </div>
        </div>
      </div>
      
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-tight dark:text-white/[75%]"
          html={product.descriptionHtml}
        />
      ) : null}
      
      {/* Always show variant selector if product has options */}
      <VariantSelector 
        options={product.options} 
        variants={product.variants} 
        onVariantChange={setSelectedVariant}
      />

      {/* Conditional Add to Cart / Pre-order button */}
      {(() => {
        // Condition 1: Product has variants and is preorder - disable until variant selected
        if (productHasPreorder && hasMultipleOptions(product) && !selectedVariant) {
          return (
            <button 
              disabled 
              className="flex w-full items-center justify-center rounded-full bg-gray-400 p-4 text-sm font-medium text-gray-600 cursor-not-allowed"
            >
              Select Options to Pre-Order
            </button>
          );
        }

        // Condition 2: Product is out of stock (no variant selected or selected variant out of stock)
        if (!inStock && !isSelectedVariantPreorder) {
          return (
            <button 
              disabled 
              className="flex w-full items-center justify-center rounded-full bg-gray-400 p-4 text-sm font-medium text-gray-600 cursor-not-allowed"
            >
              Out of Stock
            </button>
          );
        }

        // Condition 3: In stock or preorder available - show Add to Cart button
        return (
          <AddToCart 
            variants={product.variants} 
            availableForSale={product.availableForSale} 
            onCartUpdate={onCartUpdate}
            selectedVariant={selectedVariant}
          />
        );
      })()}

      {/* Low stock warning - only show when a specific variant is selected and in stock */}
      {selectedVariant && inStock && !isSelectedVariantPreorder && selectedStock <= 5 && (
        <div className="mt-2 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
          <span>⚠️</span>
          <span>Only few left in stock!</span>
        </div>
      )}
    </>
  );
}