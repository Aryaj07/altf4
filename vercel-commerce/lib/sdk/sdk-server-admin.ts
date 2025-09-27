import Medusa from "@medusajs/js-sdk";

export const sdkServeradmin = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API!,
  debug: process.env.NODE_ENV === "production",
  apiKey: process.env.MEDUSA_ADMIN_API_KEY, 
});