import { loadEnv, defineConfig } from "@medusajs/framework/utils";
import { Modules } from "@medusajs/framework/utils"
import { REVIEW_MODULE } from "./src/modules/auto_mail";
loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared",  
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    databaseDriverOptions: {
      ssl: false,
      sslmode: "disable",
    },
  },
  plugins: ["medusa-plugin-razorpay-v2",
    {
      resolve: "medusa-plugin-razorpay-v2",
      options: {}
    },
    {
      resolve: '@lambdacurry/medusa-product-reviews',
      options: {
        defaultReviewStatus: 'pending',
      },
    },
  ],
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              upload_dir: "static",
              backend_url: process.env.BACKEND_URL
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/auto_mail",
    },
    {
      resolve: "@medusajs/medusa/notification",
      dependencies: [REVIEW_MODULE],
      options: {
        providers: [
          {
            resolve: "./src/modules/review_notification",
            id: "email-provider",
            options: {
              channels: ["email", "feed"],
            },
          },
        ],
      },  
    },
    {
      resolve: "@medusajs/medusa/payment",
      dependencies: [
        Modules.PAYMENT
      ],
      options: {
        providers: [
          {
            resolve: "medusa-plugin-razorpay-v2/providers/payment-razorpay/src",
            id: "razorpay",
            options: {
              key_id:
                process?.env?.RAZORPAY_TEST_KEY_ID ?? process?.env?.RAZORPAY_ID,
              key_secret:
                process?.env?.RAZORPAY_TEST_KEY_SECRET ??
                process?.env?.RAZORPAY_SECRET,
              razorpay_account:
                process?.env?.RAZORPAY_TEST_ACCOUNT ??
                process?.env?.RAZORPAY_ACCOUNT,
              automatic_expiry_period: 30 /* any value between 12minuts and 30 days expressed in minutes*/,
              manual_expiry_period: 20,
              refund_speed: "normal",
              webhook_secret:
                process?.env?.RAZORPAY_TEST_WEBHOOK_SECRET ??
                process?.env?.RAZORPAY_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
  ],
});
