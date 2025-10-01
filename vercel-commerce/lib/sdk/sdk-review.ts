import {MedusaPluginsSDK} from '@lambdacurry/medusa-plugins-sdk';

// Initialize the SDK
export const sdkReview = new MedusaPluginsSDK({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API || 'http://localhost:9000',
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY,
});