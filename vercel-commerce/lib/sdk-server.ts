// lib/sdk-server.ts
import Medusa from "@medusajs/js-sdk";
import { cookies } from "next/headers"; // built-in in app router

export const sdkServer = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API!,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_API_KEY,
  auth: {
    type: "jwt",
    jwtTokenStorageMethod: "custom",
    storage: {
      getItem: async (key: string) => {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        return token || null;
      },
      setItem: () => {}, // not needed on server
      removeItem: () => {}, // not needed on server
    },
  },
});
