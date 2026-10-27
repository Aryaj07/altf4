import { allowFields, authenticate, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { UpsertPreorderVariantSchema } from "./admin/variants/[id]/preorders/route"
import { SearchSchema } from "./store/products/search/route"
import { RecommendSchema } from "./store/products/recommendations/route"
import { PostInvoiceConfgSchema } from "./admin/invoice-config/route"
import * as path from "path"
import multer from "multer"
import { logPaymentInitiated } from "./utils/log-payment-initiated"

// Emails are case-insensitive. Lowercase them before Medusa stores or looks
// them up, so "Name@Gmail.com" and "name@gmail.com" are the same account.
// Core validators may already have populated validatedBody, so update both.
const normalizeEmailFields = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  for (const body of [req.body, (req as any).validatedBody]) {
    if (!body || typeof body !== "object") continue
    for (const key of ["email", "identifier"]) {
      if (typeof body[key] === "string") {
        body[key] = body[key].trim().toLowerCase()
      }
    }
  }
  next()
}

export default defineMiddlewares({
  routes: [
    // Store routes only return fields on Medusa's allowlist (v2.21+). The
    // preorder_variant link is ours, so the storefront's requests for it must
    // be allowed explicitly. These must stay global: no method/methods key.
    {
      matcher: "/store/products",
      middlewares: [allowFields("variants.preorder_variant")],
    },
    {
      matcher: "/store/products/:id",
      middlewares: [allowFields("variants.preorder_variant")],
    },
    {
      matcher: "/store/carts/:id",
      middlewares: [allowFields("items.variant.preorder_variant")],
    },
    {
      matcher: "/store/orders/:id",
      middlewares: [allowFields("items.variant.preorder_variant")],
    },
    // The order list only returns the logged-in customer's orders, so the
    // storefront reads single orders (confirmation, tracking) through it.
    {
      matcher: "/store/orders",
      middlewares: [
        allowFields(
          "items.variant.preorder_variant",
          "fulfillments.labels",
          "fulfillments.items"
        ),
      ],
    },
    {
      matcher: "/auth/customer/emailpass",
      method: ["POST"],
      middlewares: [normalizeEmailFields],
    },
    {
      matcher: "/auth/customer/emailpass/register",
      method: ["POST"],
      middlewares: [normalizeEmailFields],
    },
    {
      matcher: "/auth/customer/emailpass/reset-password",
      method: ["POST"],
      middlewares: [normalizeEmailFields],
    },
    {
      matcher: "/store/customers",
      method: ["POST"],
      middlewares: [normalizeEmailFields],
    },
    {
      matcher: "/store/customers/me",
      method: ["POST"],
      middlewares: [normalizeEmailFields],
    },
    {
      matcher: "/store/carts/:id",
      method: ["POST"],
      middlewares: [normalizeEmailFields],
    },
    {
      // Raw body needed for Razorpay webhook signature verification
      matcher: "/hooks/razorpay-insights",
      method: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
    {
      matcher: "/store/payment-collections/:id/payment-sessions",
      methods: ["POST"],
      middlewares: [logPaymentInitiated],
    },
    {
      matcher: "/store/customers/me/active-cart",
      method: ["GET"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
        {
      matcher: "/admin/invoice-config",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(PostInvoiceConfgSchema as any)
      ]
    },
    {
      matcher: "/static/*",
      method: "GET",
      middlewares: [
        (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          // Use UPLOAD_DIR from env, or default to /static
          const uploadDir = process.env.UPLOAD_DIR || '/static';
          const staticDir = path.isAbsolute(uploadDir)
            ? uploadDir  // Absolute path (production: /static)
            : path.join(process.cwd(), uploadDir); // Relative path (development: ./static)

          const notFound = () => {
            if (!res.headersSent) res.status(404).json({ message: "File not found" })
          }

          // req.path excludes the query string; names are URL-encoded (spaces etc.)
          let filePath: string
          try {
            filePath = decodeURIComponent(req.path.replace(/^\/static\//, ""))
          } catch {
            return notFound()
          }

          // sendFile with `root` refuses paths that resolve outside staticDir
          // (e.g. "../.env") and hidden files, streams the file instead of
          // buffering it, and answers repeat requests with 304 via ETag.
          res.setHeader("Cache-Control", "public, max-age=31536000")
          res.sendFile(
            filePath,
            { root: staticDir, dotfiles: "deny", cacheControl: false },
            (err) => {
              if (err) notFound()
            }
          )
        }
      ]
    },
    {
      matcher: "/admin/uploads",
      method: "POST",
      middlewares: [
        (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          // Allow larger file uploads (configured in medusa-config.ts)
          next()
        }
      ]
    },
    {
      matcher: "/store/review-images",
      method: "POST",
      middlewares: [
        multer({ storage: multer.memoryStorage() }).array('files', 4) as any,
        (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          next()
        }
      ]
    },
    {
      matcher: "/admin/variants/:id/preorders",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(UpsertPreorderVariantSchema as any)
      ]
    },
    {
      matcher: "/store/products/search",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(SearchSchema as any),
      ],
    },
    {
      matcher: "/store/products/recommendations",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(RecommendSchema as any),
      ],
    },
    // {
    //   matcher: "/admin/variants/:id/preorders",
    //   methods: ["DELETE"],
    //   middlewares: []
    // },
  ]
})