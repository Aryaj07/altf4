import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

export type OrderPickerRow = {
  id: string
  display_id: number | string
  email: string
  customer_name: string | null
  status: string
  preorder_status: "pending" | "fulfilled" | "cancelled" | null
  created_at: string
  items_preview: string[]
  items_count: number
}

export type OrderPickerResponse = {
  count: number
  limit: number
  offset: number
  orders: OrderPickerRow[]
}

export const useOrderPickerList = (
  q: string,
  preorderOnly: boolean,
  limit: number,
  offset: number
) => {
  const { data, isLoading, error } = useQuery<OrderPickerResponse>({
    queryFn: () =>
      sdk.client.fetch(
        `/admin/order-updates/orders?limit=${limit}&offset=${offset}&preorder_only=${preorderOnly}${
          q ? `&q=${encodeURIComponent(q)}` : ""
        }`
      ),
    queryKey: ["order-updates", "orders", q, preorderOnly, limit, offset],
    retry: 2,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

export const useSendOrderUpdateEmail = () => {
  const queryClient = useQueryClient()

  return useMutation<
    {
      batch_id: string
      succeeded: number
      failed_count: number
      failed: { order_id: string; error: string }[]
    },
    Error,
    { order_ids: string[]; subject: string; message: string }
  >({
    mutationFn: (body) =>
      sdk.client.fetch(`/admin/order-updates/send`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-updates"] })
    },
  })
}

export type OrderUpdateEmailRow = {
  id: string
  order_id: string
  order_display_id: string | null
  email: string
  subject: string
  batch_id: string
  created_at: string
}

export type OrderUpdateHistoryResponse = {
  count: number
  limit: number
  offset: number
  order_update_emails: OrderUpdateEmailRow[]
}

export const useOrderUpdateHistory = (limit: number, offset: number) => {
  const { data, isLoading, error } = useQuery<OrderUpdateHistoryResponse>({
    queryFn: () =>
      sdk.client.fetch(
        `/admin/order-updates/history?limit=${limit}&offset=${offset}`
      ),
    queryKey: ["order-updates", "history", limit, offset],
    retry: 2,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}
