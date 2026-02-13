import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ALGOLIA_MODULE } from "../../../../modules/algolia"
import AlgoliaModuleService from "../../../../modules/algolia/service"
import { z } from "zod"

export const RecommendSchema = z.object({
  product_id: z.string(),
})

type RecommendRequest = z.infer<typeof RecommendSchema>

export async function POST(
  req: MedusaRequest<RecommendRequest>,
  res: MedusaResponse
) {
  const algoliaModuleService: AlgoliaModuleService = req.scope.resolve(ALGOLIA_MODULE)

  const { product_id } = req.validatedBody

  try {
    const results = await algoliaModuleService.getRecommendations(
      product_id as string
    )
    res.json(results)
  } catch (error) {
    // If Algolia Recommend isn't enabled or no recommendations found, return empty
    res.json({ results: [{ hits: [] }] })
  }
}
