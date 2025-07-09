export const TAGS = {
  products: 'products',
  categories: 'categories'
} as const;

export const ENDPOINT = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API ?? 'http://localhost:9000';
export const MEDUSA_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_API_KEY ?? '';
