import Medusa from "@medusajs/js-sdk";
import { cookies } from "next/headers";

export const sdkServer = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API!,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_API_KEY,
  auth: {
    type: "jwt",
    jwtTokenStorageMethod: "custom",
    storage: {
      getItem: async (_key: string) => {
        const cookieStore = await cookies();
        return cookieStore.get("auth_token")?.value || null;
      },
      setItem: async (_key: string, value: string) => {
        const cookieStore = await cookies();
        cookieStore.set("auth_token", value, {
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      },
      removeItem: async (_key: string) => {
        const cookieStore = await cookies();
        cookieStore.delete("auth_token");
      },
    },
  },
});