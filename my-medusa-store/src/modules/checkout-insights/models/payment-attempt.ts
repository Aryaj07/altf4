import { model } from "@medusajs/utils"

export enum PaymentAttemptStatus {
  INITIATED = "initiated",
  FAILED = "failed",
  AUTHORIZED = "authorized",
  CAPTURED = "captured",
}

// Append-only log: one row per payment event, rows are never updated
// (except order_id, stamped on conversion by the order.placed subscriber).
export const PaymentAttempt = model.define(
  "payment_attempt",
  {
    id: model.id({ prefix: "payatt" }).primaryKey(),
    // Nullable: a Razorpay failure webhook is still logged even when the
    // cart can't be resolved from the payload (identified by email instead).
    cart_id: model.text().index().nullable(),
    order_id: model.text().index().nullable(),
    customer_id: model.text().index().nullable(),
    email: model.text().index().nullable(),
    provider_id: model.text().default("razorpay"),
    status: model.enum(Object.values(PaymentAttemptStatus)),
    amount: model.bigNumber().nullable(),
    currency_code: model.text().nullable(),
    failure_code: model.text().nullable(),
    failure_reason: model.text().nullable(),
    external_payment_id: model.text().nullable(),
    raw_payload: model.json().nullable(),
  }
).indexes([
  {
    on: ["external_payment_id", "status"],
  },
  {
    on: ["cart_id", "status"],
  },
])
