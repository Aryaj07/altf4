import { algoliasearch, SearchClient } from "algoliasearch"

type AlgoliaOptions = {
  apiKey: string
  appId: string
  productIndexName: string
}

export type AlgoliaIndexType = "product"

export default class AlgoliaModuleService {
  private client: SearchClient
  private options: AlgoliaOptions

  constructor({}, options: AlgoliaOptions) {
    this.client = algoliasearch(options.appId, options.apiKey)
    this.options = options
  }

  async getIndexName(type: AlgoliaIndexType) {
    switch (type) {
      case "product":
        return this.options.productIndexName
      default:
        throw new Error(`Invalid index type: ${type}`)
    }
  }

  async indexData(data: Record<string, unknown>[], type: AlgoliaIndexType = "product") {
    const indexName = await this.getIndexName(type)
    this.client.saveObjects({
      indexName,
      objects: data.map((item) => ({
        ...item,
        objectID: item.id,
      })),
    })
  }

  async retrieveFromIndex(objectIDs: string[], type: AlgoliaIndexType = "product") {
    const indexName = await this.getIndexName(type)
    return await this.client.getObjects<Record<string, unknown>>({
      requests: objectIDs.map((objectID) => ({
        indexName,
        objectID,
      })),
    })
  }

  async deleteFromIndex(objectIDs: string[], type: AlgoliaIndexType = "product") {
    const indexName = await this.getIndexName(type)
    await this.client.deleteObjects({
      indexName,
      objectIDs,
    })
  }

  async search(query: string, type: AlgoliaIndexType = "product") {
    const indexName = await this.getIndexName(type)
    return await this.client.search({
      requests: [
        {
          indexName,
          query,
        },
      ],
    })
  }

  async getRecommendations(objectID: string, type: AlgoliaIndexType = "product") {
    const indexName = await this.getIndexName(type)
    // Use the search API to find similar products based on the product's data
    const sourceObj = await this.client.getObjects<Record<string, unknown>>({
      requests: [{ indexName, objectID }],
    })
    const source = sourceObj.results[0]
    if (!source) return { results: [{ hits: [] }] }

    // Search for products with similar title/categories
    const searchQuery = [source.title, ...(Array.isArray(source.categories) ? source.categories.map((c: any) => c.name) : [])]
      .filter(Boolean)
      .join(' ')

    const results = await this.client.search({
      requests: [
        {
          indexName,
          query: searchQuery,
          hitsPerPage: 10,
          filters: `NOT objectID:${objectID}`,
        },
      ],
    })
    return results
  }
}
