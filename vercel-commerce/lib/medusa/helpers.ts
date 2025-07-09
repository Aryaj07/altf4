import { isEmpty } from '../utils';
import { MedusaProductVariant, Money, RegionInfo } from './types';

type ComputeAmountParams = {
  amount: number;
  region: RegionInfo;
  includeTaxes?: boolean;
};

/**
 * Takes an amount, a region, and returns the amount as a decimal including or excluding taxes
 */
export const computeAmount = ({ amount, region, includeTaxes = true }: ComputeAmountParams) => {
  const toDecimal = convertToDecimal(amount, region.currency_code);

  const taxRate = includeTaxes ? getTaxRate(region) : 0;

  const amountWithTaxes = toDecimal * (1 + taxRate);

  return amountWithTaxes;
};

/**
 * Takes a product variant, and returns the amount as a decimal including or excluding taxes and the currency code
 */
export const calculateVariantAmount = (variant: MedusaProductVariant | undefined): Money => {
  if (!variant || !variant.prices || variant.prices.length === 0) {
    return {
      amount: '0',
      currencyCode: 'USD'
    };
  }

  const price = variant.prices[0];
  const currencyCode = price?.currency_code ?? 'USD';
  const amount = convertToDecimal(price?.amount ?? 0, currencyCode)?.toString();

  return {
    amount,
    currencyCode
  };
};

// we should probably add a more extensive list
const noDivisionCurrencies = ['krw', 'jpy', 'vnd', 'eur', 'usd'];

export const convertToDecimal = (amount: number, currencyCode = 'USD') => {
  const divisor = noDivisionCurrencies.includes(currencyCode.toLowerCase()) ? 1 : 100;

  return Math.floor(amount) / divisor;
};

const getTaxRate = (region?: RegionInfo) => {
  return region && !isEmpty(region) && region.tax_rate !== undefined ? region.tax_rate / 100 : 0;
};
