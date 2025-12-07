import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { UpsertPreorderVariantSchema } from "./admin/variants/[id]/preorders/route"
import * as fs from "fs"
import * as path from "path"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/static/*",
      method: "GET",
      middlewares: [
        (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          // Decode URL-encoded characters like %20 (spaces)
          const filePath = decodeURIComponent(req.url.replace("/static/", ""))
          
          // Try multiple possible locations
          const possiblePaths = [
            path.join(process.cwd(), "static", filePath),
            path.join("/static", filePath),
            path.join(process.cwd(), ".medusa", "server", "static", filePath),
            path.join("/app/static", filePath),
          ]

          console.log("=== Static File Request ===")
          console.log("Requested URL:", req.url)
          console.log("File path (decoded):", filePath)
          console.log("CWD:", process.cwd())
          console.log("UPLOAD_DIR env:", process.env.UPLOAD_DIR)
          
          let fileFound = false
          let foundPath = ""

          for (const testPath of possiblePaths) {
            console.log("Checking:", testPath, "- Exists:", fs.existsSync(testPath))
            if (fs.existsSync(testPath)) {
              fileFound = true
              foundPath = testPath
              break
            }
          }

          if (fileFound) {
            console.log("✓ File found at:", foundPath)
            const fileContent = fs.readFileSync(foundPath)
            const ext = path.extname(foundPath).toLowerCase()
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
            console.log("✗ File not found in any location")
            console.log("Directory listings:")
            possiblePaths.forEach(p => {
              const dir = path.dirname(p)
              if (fs.existsSync(dir)) {
                console.log(`  ${dir}:`, fs.readdirSync(dir).join(", "))
              }
            })
            next()
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