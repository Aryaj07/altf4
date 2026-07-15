import crypto from "crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CHECKOUT_INSIGHTS_MODULE } from "../../../modules/checkout-insights"
import CheckoutInsightsModuleService from "../../../modules/checkout-insights/service"
import { PaymentAttemptStatus } from "../../../modules/checkout-insights/models/payment-attempt"
import { resolveCartFromPaymentSession } from "../../utils/checkout-insights"

/**
 * Secondary Razorpay webhook endpoint used purely for analytics logging.
 * The payment plugin's own webhook (/hooks/payment/razorpay_razorpay) stays
 * untouched — register this URL additionally in the Razorpay dashboard with
 * events: payment.failed, payment.captured, payment.authorized.
 */

const EVENT_STATUS_MAP: Record<string, PaymentAttemptStatus> = {
  "payment.failed": PaymentAttemptStatus.FAILED,
  "payment.captured": PaymentAttemptStatus.CAPTURED,
  "payment.authorized": PaymentAttemptStatus.AUTHORIZED,
}

function verifySignature(rawBody: string | Buffer, signature: string): boolean {
  const secret =
    process.env.RAZORPAY_TEST_WEBHOOK_SECRET ||
    process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) {
    return false
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

/**
 * Resolve the Medusa payment session for a Razorpay payment, in order of
 * reliability:
 * 1. The plugin stores the Razorpay order inside payment_session.data —
 *    look the session up by razorpay order id (always present).
 * 2. Notes on the payment entity (session_id / medusa_payment_session_id) —
 *    present only when the plugin stamped them.
 * 3. Fetch the Razorpay order via REST and read its notes (last resort;
 *    observed empty in practice).
 */
async function resolveSessionId(
  container: MedusaRequest["scope"],
  payment: any
): Promise<string | null> {
  if (payment?.order_id) {
    try {
      const pg = container.resolve(
        ContainerRegistrationKeys.PG_CONNECTION
      ) as any
      const rows = await pg("payment_session")
        .select("id")
        .whereRaw(`data->'razorpayOrder'->>'id' = ?`, [payment.order_id])
        .limit(1)
      if (rows?.[0]?.id) {
        return rows[0].id
      }
    } catch {
      // fall through to the other strategies
    }
  }

  const fromNotes =
    payment?.notes?.session_id ?? payment?.notes?.medusa_payment_session_id
  if (fromNotes) {
    return fromNotes
  }

  const keyId = process.env.RAZORPAY_TEST_KEY_ID ?? process.env.RAZORPAY_ID
  const keySecret =
    process.env.RAZORPAY_TEST_KEY_SECRET ?? process.env.RAZORPAY_SECRET
  if (!payment?.order_id || !keyId || !keySecret) {
    return null
  }

  const resp = await fetch(
    `https://api.razorpay.com/v1/orders/${payment.order_id}`,
    {
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      },
    }
  )
  if (!resp.ok) {
    return null
  }
  const order = (await resp.json()) as any
  return order?.notes?.medusa_payment_session_id ?? null
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  const signature = req.headers["x-razorpay-signature"] as string
  const rawBody = (req as any).rawBody ?? JSON.stringify(req.body)

  if (!verifySignature(rawBody, signature)) {
    logger.warn("razorpay-insights: webhook signature validation failed")
    res.status(401).json({ message: "invalid signature" })
    return
  }

  const body = req.body as any
  const status = EVENT_STATUS_MAP[body?.event]
  const payment = body?.payload?.payment?.entity

  if (!status || !payment) {
    // Unrelated event — acknowledge so Razorpay doesn't retry/disable.
    res.json({ received: true })
    return
  }

  try {
    const insights = req.scope.resolve<CheckoutInsightsModuleService>(
      CHECKOUT_INSIGHTS_MODULE
    )

    let cartInfo = {
      cart_id: null as string | null,
      customer_id: null as string | null,
      email: null as string | null,
      currency_code: null as string | null,
    }

    try {
      const sessionId = await resolveSessionId(req.scope, payment)
      if (sessionId) {
        cartInfo = await resolveCartFromPaymentSession(req.scope, sessionId)
      }
    } catch (e: any) {
      logger.warn(
        `razorpay-insights: could not resolve cart for payment ${payment.id} -> ${e?.message}`
      )
    }

    await insights.logAttempt({
      cart_id: cartInfo.cart_id,
      customer_id: cartInfo.customer_id,
      email: cartInfo.email ?? payment.email ?? null,
      provider_id: "razorpay",
      status,
      // Razorpay amounts are in the smallest currency unit (paise for INR)
      amount: payment.amount != null ? Number(payment.amount) / 100 : null,
      currency_code:
        cartInfo.currency_code ?? payment.currency?.toLowerCase() ?? null,
      failure_code: payment.error_code ?? null,
      failure_reason: payment.error_reason ?? payment.error_description ?? null,
      external_payment_id: payment.id ?? null,
      raw_payload: {
        event: body.event,
        order_id: payment.order_id,
        method: payment.method,
        error_description: payment.error_description,
        error_source: payment.error_source,
        error_step: payment.error_step,
        contact: payment.contact,
      },
    })

    logger.info(
      `razorpay-insights: logged ${status} attempt for payment ${payment.id} (cart ${cartInfo.cart_id ?? "unresolved"})`
    )
  } catch (e: any) {
    // Never bubble errors to Razorpay — a 5xx storm gets the webhook disabled.
    logger.error(`razorpay-insights: failed to log attempt -> ${e?.message}`)
  }

  res.json({ received: true })
}
