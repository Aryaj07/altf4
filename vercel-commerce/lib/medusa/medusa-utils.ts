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
  ProductOption,
  ProductVariant,
  SelectedOption
} from './types';
import { calculateVariantAmount, computeAmount, convertToDecimal } from './helpers';

const reshapeImages = (images?: MedusaImage[], productTitle?: string): Image[] => {
  if (!images) return [];
  return images.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)![1];
    return {
      ...image,
      altText: `${productTitle} - ${filename}`
    };
  });
};

const reshapeProductOption = (productOption: MedusaProductOption): ProductOption => {
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

const reshapeProductVariant = (
  productVariant: MedusaProductVariant,
  productOptions?: MedusaProductOption[]
): ProductVariant => {
  let selectedOptions: SelectedOption[] = [];
  if (productOptions && productVariant.options) {
    selectedOptions = productVariant.options.map((option) => ({
      name: option.option?.title ?? '',
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

export const reshapeProduct = (product: MedusaProduct): Product => {
  const variant = product.variants?.[0];

  let amount = '0';
  let currencyCode = 'USD';
  if (variant && variant.prices?.[0]?.amount) {
    currencyCode = variant.prices?.[0]?.currency_code.toUpperCase() ?? 'USD';
    amount = convertToDecimal(variant.prices[0].amount, currencyCode).toString();
  }

  const priceRange = {
    maxVariantPrice: {
      amount,
      currencyCode: product.variants?.[0]?.prices?.[0]?.currency_code.toUpperCase() ?? ''
    }
  };

  const updatedAt = product.updated_at;
  const createdAt = product.created_at;
  const tags = product.tags?.map((tag) => tag.value) || [];
  const descriptionHtml = product.description ?? '';
  const featuredImageFilename = product.thumbnail?.match(/.*\/(.*)\..*/)![1];
  const featuredImage = {
    url: product.thumbnail ?? '',
    altText: product.thumbnail ? `${product.title} - ${featuredImageFilename}` : ''
  };
  const availableForSale = product.variants?.[0]?.purchasable || true;
  const images = reshapeImages(product.images, product.title);

  const variants = product.variants.map((variant) =>
    reshapeProductVariant(variant, product.options)
  );

  let options = [] as ProductOption[];
  product.options && (options = product.options.map((option) => reshapeProductOption(option)));

  return {
    ...product,
    images,
    featuredImage,
    priceRange,
    updatedAt,
    createdAt,
    tags,
    descriptionHtml,
    availableForSale,
    options,
    variants
  };
};

const reshapeLineItem = (lineItem: MedusaLineItem, currency_code: string): CartItem => {
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

export const reshapeCart = (cart: MedusaCart): Cart => {
  if (!cart) {
    throw new Error('Cannot reshape undefined cart');
  }

  // console.log('Original Medusa cart:', {
  //   region: cart.region,
  //   total: cart.total,
  //   tax_total: cart.tax_total,
  //   items: cart.items
  // });

  const lines = cart?.items?.map((item) => reshapeLineItem(item, cart?.region?.currency_code!)) || [];
  const totalQuantity = lines.reduce((a, b) => a + b.quantity, 0);
  const checkoutUrl = '/checkout'; // todo: implement medusa checkout flow
  const currencyCode = cart?.region?.currency_code?.toUpperCase() || 'EUR'; // Default to EUR as per your region

  // Prepare a safe region object that matches your backend data
  const safeRegion = cart.region ? {
    id: cart.region.id,
    name: cart.region.name,
    currency_code: cart.region.currency_code?.toLowerCase() || 'eur',
    tax_code: cart.region.tax_code || 'default',
    tax_rate: cart.region.tax_rate || 0,
    created_at: cart.region.created_at,
    updated_at: cart.region.updated_at,
    deleted_at: cart.region.deleted_at,
    automatic_taxes: cart.region.automatic_taxes ?? true,
    metadata: cart.region.metadata,
    countries: cart.region.countries || [],
    payment_providers: cart.region.payment_providers || []
  } : undefined;

  let subtotalAmount = '0';
  let totalAmount = '0';
  let totalTaxAmount = '0';

  try {
    if (cart?.subtotal && safeRegion) {
      subtotalAmount = computeAmount({ amount: cart.subtotal, region: safeRegion }).toString();
    }
    if (cart?.total && safeRegion) {
      totalAmount = computeAmount({ amount: cart.total, region: safeRegion }).toString();
    }
    if (cart?.tax_total && safeRegion) {
      totalTaxAmount = computeAmount({ amount: cart.tax_total, region: safeRegion }).toString();
    }
  } catch (e) {
    console.error('Error computing cart amounts:', e);
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

  const reshaped: Cart = {
    id: cart.id,
    email: cart.email,
    region_id: cart.region_id,
    region: safeRegion, // Use our safe region object
    items: cart.items || [],
    created_at: cart.created_at,
    updated_at: cart.updated_at,
    completed_at: cart.completed_at,
    type: cart.type || 'default',
    total: cart.total || 0,
    subtotal: cart.subtotal || 0,
    tax_total: cart.tax_total || 0,
    shipping_total: cart.shipping_total || 0,
    lines,
    totalQuantity,
    checkoutUrl,
    cost
  };

  return reshaped;
};
