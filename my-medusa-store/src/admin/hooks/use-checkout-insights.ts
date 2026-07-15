import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

export type CheckoutOverview = {
  range: { from: string; to: string }
  funnel: {
    created: number
    checkout_started: number
    payment_reached: number
    completed: number
  }
  rates: {
    checkout_start_rate: number
    payment_reach_rate: number
    completion_rate: number
    abandonment_rate: number
  }
  attempts: {
    by_status: Record<string, number>
    total: number
    carts_with_failed_no_order: number
    carts_failed_then_recovered: number
    failure_reasons: { reason: string; count: number }[]
  }
}

export type AbandonedCartRow = {
  cart_id: string
  email: string | null
  customer: { id: string; name: string } | null
  currency_code: string
  total: number | null
  items_count: number
  items_preview: string[]
  stage: "created" | "checkout_started" | "payment_reached" | "payment_failed"
  failed_attempts: number
  recovery_email: { sent_at: string; manual?: boolean } | null
  created_at: string
  updated_at: string
}

export type AbandonedCartsResponse = {
  count: number
  limit: number
  offset: number
  carts: AbandonedCartRow[]
}

export type CustomerInsights = {
  customer: { id: string; email: string; name: string; created_at: string }
  open_carts: {
    cart_id: string
    currency_code: string
    total: number | null
    items: {
      title: string
      quantity: number
      unit_price: number | null
      thumbnail: string | null
    }[]
    recovery_email: { sent_at: string; manual?: boolean } | null
    created_at: string
    updated_at: string
  }[]
  attempts: {
    id: string
    cart_id: string | null
    order_id: string | null
    status: "initiated" | "failed" | "authorized" | "captured"
    amount: number | null
    currency_code: string | null
    failure_code: string | null
    failure_reason: string | null
    created_at: string
  }[]
  summary: {
    failed_attempts_not_converted: number
    orders_count: number
    lifetime_value: number
  }
}

export const useCheckoutOverview = (from: string, to: string) => {
  const { data, isLoading, error } = useQuery<CheckoutOverview>({
    queryFn: () =>
      sdk.client.fetch(
        `/admin/checkout-insights/overview?from=${from}&to=${to}`
      ),
    queryKey: ["checkout-insights", "overview", from, to],
    retry: 2,
    refetchOnWindowFocus: false,
  })

  return { overview: data, isLoading, error }
}

export const useAbandonedCarts = (
  limit: number,
  offset: number,
  stage?: string
) => {
  const stageParam = stage ? `&stage=${stage}` : ""
  const { data, isLoading, error } = useQuery<AbandonedCartsResponse>({
    queryFn: () =>
      sdk.client.fetch(
        `/admin/checkout-insights/abandoned-carts?limit=${limit}&offset=${offset}${stageParam}`
      ),
    queryKey: ["checkout-insights", "abandoned-carts", limit, offset, stage],
    retry: 2,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

export const useCustomerInsights = (customerId: string) => {
  const { data, isLoading, error } = useQuery<CustomerInsights>({
    queryFn: () =>
      sdk.client.fetch(`/admin/checkout-insights/customers/${customerId}`),
    queryKey: ["checkout-insights", "customer", customerId],
    retry: 2,
    refetchOnWindowFocus: false,
  })

  return { insights: data, isLoading, error }
}

export type RecoveryEmailRow = {
  id: string
  cart_id: string
  customer_id: string | null
  email: string
  subject: string
  items: { title: string; quantity: number; line_total_formatted: string }[]
  total_formatted: string | null
  manual: boolean
  created_at: string
}

export type RecoveryEmailsResponse = {
  count: number
  limit: number
  offset: number
  recovery_emails: RecoveryEmailRow[]
}

export const useRecoveryEmails = (limit: number, offset: number) => {
  const { data, isLoading, error } = useQuery<RecoveryEmailsResponse>({
    queryFn: () =>
      sdk.client.fetch(
        `/admin/checkout-insights/recovery-emails?limit=${limit}&offset=${offset}`
      ),
    queryKey: ["checkout-insights", "recovery-emails", limit, offset],
    retry: 2,
    refetchOnWindowFocus: false,
  })

  return { data, isLoading, error }
}

export const useRecoveryEmailDetail = (id: string | null) => {
  const { data, isLoading } = useQuery<{
    recovery_email: RecoveryEmailRow & { html: string }
  }>({
    queryFn: () =>
      sdk.client.fetch(`/admin/checkout-insights/recovery-emails/${id}`),
    queryKey: ["checkout-insights", "recovery-email", id],
    enabled: !!id,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  return { detail: data?.recovery_email, isLoading }
}

export const useSendRecoveryEmail = () => {
  const queryClient = useQueryClient()

  return useMutation<
    { sent: boolean; sent_to: string; sent_at: string },
    Error,
    { cart_id: string; force?: boolean }
  >({
    mutationFn: ({ cart_id, force }) =>
      sdk.client.fetch(
        `/admin/checkout-insights/carts/${cart_id}/send-recovery-email`,
        {
          method: "POST",
          body: { force: !!force },
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkout-insights"] })
    },
  })
}
