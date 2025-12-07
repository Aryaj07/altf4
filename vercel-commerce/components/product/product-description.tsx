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
  hasMultipleOptions,
  getPreorderETA,
  formatPreorderETA
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
  
  // Get preorder ETA if variant is preorder
  const preorderETA = isSelectedVariantPreorder ? getPreorderETA(variantToCheck) : null;
  const formattedETA = formatPreorderETA(preorderETA);

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
        // Condition 1: Product has multiple options but no variant selected - show select options
        if (hasMultipleOptions(product) && !selectedVariant) {
          return (
            <button 
              disabled 
              className="flex w-full items-center justify-center rounded-full bg-gray-400 p-4 text-sm font-medium text-gray-600 cursor-not-allowed"
            >
              {productHasPreorder ? 'Select Options to Pre-Order' : 'Please Select Options'}
            </button>
          );
        }

        // Condition 2: Product is out of stock (selected variant out of stock and not preorder)
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

      {/* Preorder ETA badge - show when variant is preorder and has ETA */}
      {isSelectedVariantPreorder && formattedETA && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Pre-Order Item</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Estimated Shipping: <span className="font-medium">{formattedETA}</span>
              </p>
            </div>
          </div>
        </div>
      )}

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