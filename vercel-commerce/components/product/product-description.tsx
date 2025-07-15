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

  // Use selected variant's price if available, else fallback to product priceRange
  const price = selectedVariant?.price?.amount || product.priceRange.maxVariantPrice.amount;
  const currencyCode = selectedVariant?.price?.currencyCode || product.priceRange.maxVariantPrice.currencyCode;

  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-5xl font-medium">{product.title}</h1>
        <div className="mr-auto w-auto rounded-full bg-blue-600 p-2 text-sm text-white">
          <Price
            amount={price}
            currencyCode={currencyCode}
            showCurrency={false}
          />
        </div>
      </div>
      <VariantSelector 
        options={product.options} 
        variants={product.variants} 
        onVariantChange={setSelectedVariant}
      />

      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-tight dark:text-white/[60%]"
          html={product.descriptionHtml}
        />
      ) : null}

      <AddToCart 
        variants={product.variants} 
        availableForSale={product.availableForSale} 
        onCartUpdate={onCartUpdate}
        selectedVariant={selectedVariant}
      />
    </>
  );
}
