import Medusa from "@medusajs/js-sdk";

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API;

if (!MEDUSA_BACKEND_URL) {
  throw new Error("❌ NEXT_PUBLIC_MEDUSA_BACKEND_API is not defined");
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_API_KEY,
});
