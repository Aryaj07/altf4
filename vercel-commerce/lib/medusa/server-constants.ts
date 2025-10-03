export const TAGS = {
  products: 'products',
  categories: 'categories'
} as const;

export const ENDPOINT = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API;
export const MEDUSA_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY ?? '';
