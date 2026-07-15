import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

export type PreorderProductRow = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  variants: {
    id: string
    title: string
    sku: string | null
    preorder: { status: "enabled" | "disabled"; available_date: string } | null
  }[]
}

export type PreorderProductsResponse = {
  count: number
  limit: number
  offset: number
  products: PreorderProductRow[]
}

export const usePreorderProducts = (
  q: string,
  limit: number,
  offset: number
) => {
  const { data, isLoading, error } = useQuery<PreorderProductsResponse>({
    queryFn: () =>
      sdk.client.fetch(
        `/admin/preorders/products?limit=${limit}&offset=${offset}${
          q ? `&q=${encodeURIComponent(q)}` : ""
        }`
      ),
    queryKey: ["preorders", "products", q, limit, offset],
    retry: 2,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

export const useBulkPreorder = () => {
  const queryClient = useQueryClient()

  return useMutation<
    {
      action: string
      succeeded: number
      failed_count: number
      failed: { variant_id: string; error: string }[]
    },
    Error,
    { variant_ids: string[]; action: "enable" | "disable"; available_date?: string }
  >({
    mutationFn: (body) =>
      sdk.client.fetch(`/admin/preorders/bulk`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preorders"] })
    },
  })
}
