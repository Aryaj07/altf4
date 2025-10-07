import { useState } from 'react';
import { AddToCart } from 'components/cart/add-to-cart';
import Price from 'components/price-new';
import Prose from 'components/prose';
import { Product, ProductVariant } from 'lib/medusa/types';
import { VariantSelector } from './variant-selector';

export function ProductDescription({ 
  product,
  onCartUpdate
}: { 
  product: Product;
  onCartUpdate: () => Promise<void>;
}) {
  // Track the selected variant, default to the first if it exists
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );

  // Enhanced stock checking with multiple fallbacks
  const getStockQuantity = (variant: any): number => {
    // Path 1: Direct inventory_quantity (most reliable)
    if (typeof variant?.inventory_quantity === 'number') {
      return variant.inventory_quantity;
    }
    
    console.log('No stock info found, defaulting to 0');
    return 0;
  };

  // Get stock info for all variants
  const getAllVariantStocks = () => {
    if (!product.variants || product.variants.length === 0) {
      return { stocks: [], maxStock: 0, totalStock: 0, hasAnyStock: false };
    }

    const stocks = product.variants.map(variant => getStockQuantity(variant));
    const maxStock = Math.max(...stocks);
    const totalStock = stocks.reduce((sum, stock) => sum + stock, 0);
    const hasAnyStock = stocks.some(stock => stock > 0);

    return { stocks, maxStock, totalStock, hasAnyStock };
  };

  const { maxStock, hasAnyStock } = getAllVariantStocks();

  // Determine stock status
  const selectedStock = selectedVariant ? getStockQuantity(selectedVariant) : maxStock;
  const inStock = selectedVariant ? selectedStock > 0 : hasAnyStock;

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
      
      <VariantSelector 
        options={product.options} 
        variants={product.variants} 
        onVariantChange={setSelectedVariant}
      />

      {/* Conditional Add to Cart button */}
      {inStock ? (
        <AddToCart 
          variants={product.variants} 
          availableForSale={product.availableForSale} 
          onCartUpdate={onCartUpdate}
          selectedVariant={selectedVariant}
        />
      ) : (
        <button 
          disabled 
          className="flex w-full items-center justify-center rounded-full bg-gray-400 p-4 text-sm font-medium text-gray-600 cursor-not-allowed"
        >
          Out of Stock
        </button>
      )}

      {/* Low stock warning - only show when a specific variant is selected */}
      {selectedVariant && inStock && selectedStock <= 5 && (
        <div className="mt-2 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
          <span>⚠️</span>
          <span>Only few left in stock!</span>
        </div>
      )}
    </>
  );
}