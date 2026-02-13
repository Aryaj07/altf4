import {
  Cart,
  CartItem,
  Image,
  MedusaCart,
  MedusaImage,
  MedusaLineItem,
  MedusaProduct,
  MedusaProductOption,
  MedusaProductVariant,
  Product,
  ProductCategory,
  ProductCollection,
  ProductOption,
  ProductVariant,
  SelectedOption
} from './types';
import { mapOptionIds } from 'lib/utils';
import { calculateVariantAmount, computeAmount, convertToDecimal } from './helpers';
import { StorePreorderVariant } from "./types"

export const isMedusaError = (error: unknown): error is { status: number; message: string } => {
  return typeof error === 'object' && error !== null && 'message' in error;
};

export { calculateVariantAmount, computeAmount, convertToDecimal };

export const reshapeCart = (cart: MedusaCart): Cart => {
  const lines = cart?.items?.map((item) => reshapeLineItem(item, cart?.region?.currency_code!)) || [];
  const totalQuantity = lines.reduce((a, b) => a + b.quantity, 0);
  const checkoutUrl = '/checkout'; // todo: implement medusa checkout flow
  const currencyCode = cart.region?.currency_code.toUpperCase() || 'USD';

  let subtotalAmount = '0';
  if (cart.subtotal && cart.region) {
    subtotalAmount = computeAmount({ amount: cart.subtotal, region: cart.region }).toString();
  }

  let totalAmount = '0';
  if (cart.total && cart.region) {
    totalAmount = computeAmount({ amount: cart.total, region: cart.region }).toString();
  }

  let totalTaxAmount = '0';
  if (cart.tax_total && cart.region) {
    totalTaxAmount = computeAmount({ amount: cart.tax_total, region: cart.region }).toString();
  }

  const cost = {
    subtotalAmount: {
      amount: subtotalAmount,
      currencyCode: currencyCode
    },
    totalAmount: {
      amount: totalAmount,
      currencyCode: currencyCode
    },
    totalTaxAmount: {
      amount: totalTaxAmount,
      currencyCode: currencyCode
    }
  };

  return {
    ...cart,
    totalQuantity,
    checkoutUrl,
    lines,
    cost
  };
};

export const reshapeLineItem = (lineItem: MedusaLineItem, currency_code: string): CartItem => {
  const product = {
    title: lineItem.title,
    priceRange: {
      maxVariantPrice: convertToDecimal(lineItem.quantity * lineItem.unit_price, currency_code)
    },
    updatedAt: lineItem.updated_at,
    createdAt: lineItem.created_at,
    tags: [],
    descriptionHtml: lineItem.description ?? '',
    featuredImage: {
      url: lineItem.thumbnail ?? '',
      altText: lineItem.title ?? ''
    },
    availableForSale: true,
    variants: [lineItem.variant && reshapeProductVariant(lineItem.variant)],
    handle: lineItem.variant?.product?.handle ?? '',
    options: [] as ProductOption[]
  };

  const selectedOptions =
    lineItem.variant?.options?.map((option) => ({
      name: option.option?.title ?? '',
      value: option.value
    })) || [];

  const merchandise = {
    id: lineItem.variant_id || lineItem.id,
    selectedOptions,
    product,
    title: lineItem.description ?? ''
  };

  const cost = {
    totalAmount: {
      amount: convertToDecimal(
        lineItem.total,
        lineItem.variant?.prices?.[0]?.currency_code
      ).toString(),
      currencyCode: lineItem.variant?.prices?.[0]?.currency_code.toUpperCase() || 'EUR'
    }
  };
  const quantity = lineItem.quantity;

  return {
    ...lineItem,
    merchandise: merchandise as any,
    cost,
    quantity
  };
};

export const reshapeImages = (images?: MedusaImage[], productTitle?: string): Image[] => {
  if (!images) return [];
  return images.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)![1];
    return {
      ...image,
      altText: `${productTitle} - ${filename}`
    };
  });
};

export function reshapeProduct(product: MedusaProduct): Product {
  if (!product) return null as unknown as Product;

  // Calculate lowest price across all variants
  let minAmount = Infinity;
  let currencyCode = 'EUR';

  try {
    for (const variant of product.variants || []) {
      const calculated_price = (variant as any)?.calculated_price;
      if (calculated_price?.calculated_amount != null && calculated_price.calculated_amount < minAmount) {
        minAmount = calculated_price.calculated_amount;
        currencyCode = calculated_price.currency_code?.toUpperCase();
      }
    }
  } catch (error) {
    console.error('Error calculating min price:', error);
  }
  if (minAmount === Infinity) minAmount = 0;
  const amount = minAmount.toString();

  // Reshape variants with proper price handling
  const variants = (product.variants || []).map((variant: MedusaProductVariant): ProductVariant => {
    let variantAmount = '0';
    let variantCurrencyCode = currencyCode;

    try {
      const variantPrice = variant.prices?.[0];
      if (variantPrice) {
        variantAmount = variantPrice.amount
          ? (variantPrice.amount).toString()
          : '0';
        variantCurrencyCode = variantPrice.currency_code?.toUpperCase() || currencyCode;
      }
    } catch (error) {
      console.error('Error processing variant price:', error);
    }
    
    return {
      ...variant,
      availableForSale: (() => {
        const preorder = (variant as any)?.preorder_variant;
        // Preorder is only valid if status is enabled AND available_date is in the future
        if (preorder?.status === 'enabled' && preorder.available_date) {
          if (new Date(preorder.available_date) > new Date()) return true;
        }
        if (variant.allow_backorder) return true;
        if (variant.manage_inventory === true) return variant.inventory_quantity > 0;
        return true;
      })(),
      selectedOptions: (variant.options || []).map((option) => ({
        name: option.option?.title || '',
        value: option.value || ''
      })),
      price: {
        amount: variantAmount,
        currencyCode: variantCurrencyCode
      }
    };
  });

  // Handle featured image and other images
  const images = (product.images || []).map((image: MedusaImage): Image => ({
    ...image,
    altText: image.metadata?.altText || product.title || 'Product image'
  }));

  const featuredImage = images[0] || {
    url: '',
    altText: product.title || 'Product image'
  };



  return {
    id: product.id,
    handle: product.handle || '',
    title: product.title,
    description: product.description || '',
    availableForSale: variants.some(v => v.availableForSale),
    images: images,
    featuredImage,
    priceRange: {
      maxVariantPrice: {
        amount,
        currencyCode
      }
    },
    seo: {
      title: product.title,
      description: product.description || ''
    },
    tags: product.tags?.map(tag => tag.value) || [],
    updatedAt: new Date(product.updated_at),
    createdAt: new Date(product.created_at),
    variants,
    options: (product.options || []).map((option: MedusaProductOption): ProductOption => ({
      id: option.id,
      title: option.title,
      product_id: option.product_id,
      created_at: option.created_at,
      updated_at: option.updated_at,
      deleted_at: option.deleted_at,
      metadata: option.metadata,
      availableForSale: true,
      name: option.title,
      values: option.values?.map(val => val.value) || []
    })),
    descriptionHtml: product.description || ''
  };
}


export const reshapeProductOption = (productOption: MedusaProductOption): ProductOption => {
  const availableForSale = productOption.product?.variants?.[0]?.purchasable || true;
  const name = productOption.title;
  let values = productOption.values?.map((option) => option.value) || [];
  values = [...new Set(values)];

  return {
    ...productOption,
    availableForSale,
    name,
    values
  };
};

export const reshapeProductVariant = (
  productVariant: MedusaProductVariant,
  productOptions?: MedusaProductOption[]
): ProductVariant => {
  let selectedOptions: SelectedOption[] = [];
  if (productOptions && productVariant.options) {
    const optionIdMap = mapOptionIds(productOptions);
    selectedOptions = productVariant.options.map((option) => ({
      name: optionIdMap[option.option_id?? ''] ?? '',
      value: option.value
    }));
  }
  const availableForSale = productVariant.purchasable || true;
  const price = calculateVariantAmount(productVariant);

  return {
    ...productVariant,
    availableForSale,
    selectedOptions,
    price
  };
};

export const reshapeCategory = (category: ProductCategory): ProductCollection => {
  const description = category.description || category.metadata?.description?.toString() || '';
  const seo = {
    title: category?.metadata?.seo_title?.toString() || category.name || '',
    description: category?.metadata?.seo_description?.toString() || category.description || ''
  };
  const path = `/search/${category.handle}`;
  const updatedAt = category.updated_at;
  const title = category.name;

  return {
    ...category,
    description,
    seo,
    title,
    path,
    updatedAt
  };
};



export function isPreorder(
  preorderVariant: StorePreorderVariant | undefined
): boolean {
  return preorderVariant?.status === "enabled" &&
    (preorderVariant.available_date
      ? new Date(preorderVariant.available_date) > new Date()
      : false)
}