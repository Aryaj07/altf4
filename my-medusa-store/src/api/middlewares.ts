import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { UpsertPreorderVariantSchema } from "./admin/variants/[id]/preorders/route"
import { PostInvoiceConfgSchema } from "./admin/invoice-config/route"
import * as fs from "fs"
import * as path from "path"
import multer from "multer"

export default defineMiddlewares({
  routes: [
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
          const filePath = decodeURIComponent(req.url.replace("/static/", ""))
          const fullPath = path.join(process.cwd(), "static", filePath)

          if (fs.existsSync(fullPath)) {
            const fileContent = fs.readFileSync(fullPath)
            const ext = path.extname(fullPath).toLowerCase()
            const contentTypes: Record<string, string> = {
              ".jpg": "image/jpeg",
              ".jpeg": "image/jpeg",
              ".png": "image/png",
              ".gif": "image/gif",
              ".webp": "image/webp",
              ".svg": "image/svg+xml",
            }
            res.setHeader("Content-Type", contentTypes[ext] || "application/octet-stream")
            res.setHeader("Cache-Control", "public, max-age=31536000")
            res.send(fileContent)
          } else {
            res.status(404).json({ message: "File not found" })
          }
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
    // {
    //   matcher: "/admin/variants/:id/preorders",
    //   methods: ["DELETE"],
    //   middlewares: []
    // },
  ]
})