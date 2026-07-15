# Customer Insights / Checkout Funnel — Design Document

**Status:** Proposed (no code written yet)
**Date:** 2026-07-15
**Scope:** Medusa backend (`my-medusa-store`) only. No storefront (vercel-commerce) changes required for v1.

---

## 1. Goal

Answer, from inside the Medusa Admin, the questions:

1. **Who has an active cart right now, and what's in it?**
2. **How many customers reach checkout but never complete it?** (funnel + abandonment rate)
3. **How many times did a customer *try* to pay and fail?** (payment attempts, failure reasons)
4. **Per-customer view:** carts, attempts, and conversion history — a lightweight CRM panel on the customer detail page.

## 1b. Reuse map — official resources vs. custom work

Reviewed: the [abandoned-cart tutorial](https://docs.medusajs.com/resources/how-to-tutorials/tutorials/abandoned-cart) (+ its code in [medusajs/examples/abandoned-cart](https://github.com/medusajs/examples)), the [Segment guide](https://docs.medusajs.com/resources/integrations/guides/segment), and the Analytics Module docs.

| Piece of this feature | Source | From scratch? |
|---|---|---|
| Abandoned-cart definition + query (`completed_at IS NULL`, `email` set, `updated_at` older than threshold, has items, metadata flag to avoid double-processing) | **Copy from the abandoned-cart example** — its `src/workflows` + scheduled job are documented as drop-in for existing projects | No — copy & adapt |
| Recovery-email job (v2 feature) | **Copy the example's workflow/job**, swap its SendGrid notification step for your existing `auto_mail` Mailjet module | Mostly reuse |
| Funnel/checkout event tracking to an external tool | Medusa's built-in **Analytics Module** (PostHog/Segment providers) — configure in `medusa-config.ts`, fire events from subscribers | Optional add-on, near-zero code |
| **Payment attempt/failure history** | Nothing exists — the tutorial, the Segment guide, and the examples repo all skip payment failures. Core only keeps the *latest* session status | **Yes — custom** (the `payment_attempt` module, §4) |
| **In-admin dashboard UI** | No official example ships an admin analytics page | **Yes — custom** (but small: one route page + one widget using `@medusajs/ui`, same pattern as your existing `orders/export` page) |

Key judgment call: the Segment/PostHog route gives you funnels **outside** the Medusa admin (in PostHog's UI) and still doesn't capture payment failures — so it complements but cannot replace the in-admin design. The genuinely custom surface is small: the attempt log and two admin UI files. Everything else is copied or derived.

## 2. What Medusa already stores vs. what's missing

| Question | Existing data | Gap |
|---|---|---|
| Cart contents | `cart` + `line_item` tables; `completed_at IS NULL` = abandoned/open | None — queryable via Query graph |
| Reached checkout | Cart has `email` / `shipping_address` / shipping method set | None — derivable |
| Initiated payment | `payment_collection` + `payment_session` exist on cart | Only **latest** state; no timestamps per attempt |
| Failed payment attempts | Razorpay webhook `payment.failed` → `PaymentActions.FAILED` → session status flips to `error` | **No history.** A retry overwrites the session status. Count of attempts and failure reasons are lost |
| Completed checkout | `order` table, `order.placed` event | None |

**Conclusion:** the funnel's top and bottom are derivable from existing tables. The middle (payment attempts / failures) needs a new append-only log table, populated from Razorpay webhooks.

## 3. Architecture overview

```
Storefront (Next.js)                Razorpay
      │                                │
      │ initiate payment session       │ payment.failed / payment.captured /
      ▼                                │ order.paid webhooks
Medusa store API                       ▼
      │                    ┌───────────────────────────┐
      │ middleware taps    │ POST /hooks/razorpay-     │  (secondary webhook URL,
      │ session creation   │      insights             │   signature-verified)
      ▼                    └────────────┬──────────────┘
┌─────────────────────────────────────┐│
│  checkout-insights module           │◄┘
│  table: payment_attempt (append-only)│
└────────────────┬────────────────────┘
                 │
   /admin/checkout-insights/* API routes
                 │
   Admin UI: "Customer Insights" page + customer-detail widget
```

Three data-capture points, all additive (no core/plugin patching):

1. **Payment initiated** — a middleware in `src/api/middlewares.ts` on `POST /store/payment-collections/:id/payment-sessions` logs an `initiated` attempt after the route succeeds.
2. **Payment failed / captured** — a **second Razorpay webhook endpoint** (`src/api/hooks/razorpay-insights/route.ts`). Razorpay supports multiple webhook URLs, so the existing plugin webhook keeps doing its job untouched; ours only logs. Signature verified with the same webhook secret. Events consumed: `payment.failed` (with `error_code`, `error_description`, `error_reason`), `payment.captured`, `payment.authorized`.
3. **Checkout completed** — existing `order.placed` event via a new subscriber marks the cart's attempt chain as converted (and denormalizes `order_id`).

Everything else (open carts, funnel stages, cart contents) is **computed at read time** from core tables via Query graph — no duplication, no sync drift.

## 4. New module: `checkout-insights`

Follows the same pattern as `src/modules/preorder` (module + models + migrations + service).

```
src/modules/checkout-insights/
├── index.ts                  // Module("checkout_insights", { service })
├── service.ts                // MedusaService({ PaymentAttempt })
├── models/
│   └── payment-attempt.ts
└── migrations/
```

### Model: `payment_attempt`

| Field | Type | Notes |
|---|---|---|
| `id` | pk | `payatt_...` |
| `cart_id` | text, indexed | from session-create route / webhook notes |
| `order_id` | text, nullable, indexed | set on conversion |
| `customer_id` | text, nullable, indexed | null for guests |
| `email` | text, nullable, indexed | fallback identity for guests |
| `provider_id` | text | `razorpay` (future-proof for other providers) |
| `status` | enum: `initiated` \| `failed` \| `authorized` \| `captured` | one row per event, **never updated** — append-only |
| `amount` | bigNumber | |
| `currency_code` | text | |
| `failure_code` | text, nullable | Razorpay `error_code` (e.g. `BAD_REQUEST_ERROR`) |
| `failure_reason` | text, nullable | Razorpay `error_reason` (e.g. `payment_declined`, `payment_timeout`) |
| `external_payment_id` | text, nullable, unique-ish | Razorpay `payment_id` — used for **idempotency** (webhooks retry) |
| `raw_payload` | json, nullable | trimmed webhook payload for debugging |
| `created_at` | timestamptz | |

**Why append-only rows instead of a counter on the customer:** preserves failure reasons and timing, makes "attempted 3× in 10 minutes then gave up" visible, and is idempotent-safe under Razorpay's webhook retries (dedupe on `external_payment_id + status`).

**No module link needed for v1** — `customer_id`/`cart_id` are plain indexed columns queried through the module service; joins to core entities happen in the API layer via Query. (A `link` to the customer module can be added later if we want the attempts to appear in Query graph expansions.)

## 5. Data capture details

### 5.1 Middleware — payment initiated
In `src/api/middlewares.ts` (already exists), add a matcher for `/store/payment-collections/:id/payment-sessions`. After response, resolve the payment collection → cart, and insert an `initiated` row. Failure to log must never fail the checkout (fire-and-forget with try/catch + logger warn).

### 5.2 Webhook route — failed / captured
`src/api/hooks/razorpay-insights/route.ts`:
- Verify `x-razorpay-signature` (HMAC-SHA256 with `RAZORPAY_WEBHOOK_SECRET` — same env var the plugin uses).
- Map events:
  - `payment.failed` → status `failed`, capture `error_code/description/reason`, amount, and `notes.cart_id` (the plugin puts the Medusa session/cart reference in Razorpay order `notes` — verified in plugin source; exact key confirmed during implementation).
  - `payment.captured` / `order.paid` → status `captured`.
- Idempotency: skip if a row with same `external_payment_id` + `status` exists.
- Always return 200 fast (log async) so Razorpay doesn't disable the webhook.

**Setup step (manual, documented):** add the second webhook URL in the Razorpay dashboard pointing at `/hooks/razorpay-insights` with events `payment.failed`, `payment.captured`, `order.paid`.

### 5.3 Subscriber — conversion
`src/subscribers/checkout-insights-order-placed.ts` on `order.placed`: look up attempts by the order's `cart_id`, stamp `order_id` on them. (Coexists with your existing `order-placed.ts` subscriber — Medusa allows multiple subscribers per event.)

## 6. Admin API routes

All under `src/api/admin/checkout-insights/` (auto-protected by admin auth).

| Route | Returns |
|---|---|
| `GET /admin/checkout-insights/overview?from&to` | KPI cards + funnel: carts created, carts with email (checkout started), carts with payment session (payment reached), attempts initiated, attempts failed, orders completed, abandonment %, failure-reason breakdown |
| `GET /admin/checkout-insights/abandoned-carts?limit&offset&stage` | Open carts (`completed_at IS NULL`, has items), joined with customer + last payment attempt; filter by funnel stage; sorted by cart value / recency |
| `GET /admin/checkout-insights/customers/:id` | Per-customer: open cart(s) with items, attempt history, orders count, lifetime value |
| `POST /admin/checkout-insights/carts/:id/send-recovery-email` | **Manual send button.** Triggers `sendCartRecoveryEmailWorkflow` for one cart on demand — the same workflow the optional cron job (phase 6) runs in batch, so both paths share one implementation. Stamps `metadata.abandoned_notification` on the cart (with timestamp + `manual: true`) so the cron won't double-send. Returns 409 if already sent recently |

Funnel stage definitions (computed, documented in code):

```
created          cart exists, has ≥1 line item
checkout_started cart.email IS NOT NULL
payment_reached  payment_collection exists on cart
payment_failed   ≥1 payment_attempt row with status=failed, no order
completed        cart.completed_at IS NOT NULL
```

## 7. Admin UI

Follows the existing pattern (`src/admin/routes/orders/export/page.tsx`, widgets in `src/admin/widgets/`).

### 7.1 Sidebar page — `src/admin/routes/customer-insights/page.tsx`
Registered with `defineRouteConfig({ label: "Customer Insights", icon: ChartBar })` → appears in the admin sidebar.

Layout (top to bottom):
1. **Date-range picker** (last 7 / 30 / 90 days, custom)
2. **KPI cards:** open carts, abandonment rate, failed payment attempts, recovered-after-failure rate
3. **Funnel bar** — the 5 stages above with counts and drop-off %
4. **Failure reasons table** — Razorpay `error_reason` grouped with counts (tells you *why* people fail: declined vs timeout vs UPI issues)
5. **Abandoned carts table** — customer/email, items count, cart value, stage, failed attempts count, last activity; row click → customer or cart. Each row has a **"Send recovery email" button** (calls the manual-send route above; disabled with a tooltip if an email was already sent, showing when)

### 7.2 Customer detail widget — `src/admin/widgets/customer-checkout-insights.tsx`
Injected at zone `customer.details.after`. Shows for the viewed customer:
- Active cart contents (items, qty, value)
- Payment attempt timeline (initiated/failed/captured with reasons and timestamps)
- "Tried to pay N times without completing" badge

Data fetching via the existing `src/admin/lib/sdk.ts` JS SDK client + `@tanstack/react-query` hooks in `src/admin/hooks/` (matches `use-preorders.ts` pattern).

## 8. What v1 deliberately excludes

- **Browsing/session analytics** (page views, add-to-cart events from the storefront) — needs frontend instrumentation; can be a v2 sending events to a `/store/insights/events` route.
- **Automated recovery emails** — the data model supports it (you already have Mailjet + `auto_mail` module); a v2 job can email customers with `failed` attempts and open carts.
- **Historical backfill of failed attempts** — webhook log starts at deploy time. Partial backfill is possible via Razorpay Payments API (`payments?status=failed`) as an optional one-off script (`src/scripts/backfill-payment-attempts.ts`).

## 9. Implementation plan (phases)

| Phase | Work | Files |
|---|---|---|
| 1 | Module + model + migration | `src/modules/checkout-insights/*`, register in `medusa-config.ts`, `npx medusa db:migrate` |
| 2 | Capture: webhook route, middleware, subscriber | `src/api/hooks/razorpay-insights/route.ts`, `src/api/middlewares.ts`, `src/subscribers/checkout-insights-order-placed.ts` |
| 3 | Admin API routes | `src/api/admin/checkout-insights/*` |
| 4 | Admin UI page + customer widget | `src/admin/routes/customer-insights/page.tsx`, `src/admin/widgets/customer-checkout-insights.tsx`, hooks |
| 5 | Razorpay dashboard webhook config + docs | `CUSTOMER_INSIGHTS_SETUP.md` |
| 6 ✅ | Recovery-email cron — `send-abandoned-cart-emails` job reuses the button's workflow; one email per address per run, once per cart ever; env knobs `ABANDONED_CART_CRON` (default 04:00 UTC), `ABANDONED_CART_INACTIVE_HOURS` (24), `ABANDONED_CART_DRY_RUN` | `src/jobs/send-abandoned-cart-emails.ts` |
| 7 (opt.) | PostHog funnels — register Analytics Module provider, fire checkout events from the same capture points | `medusa-config.ts`, small tracking step |

Each phase is independently shippable; the funnel/abandoned-carts view (phases 1, 3, 4 minus attempt data) works even before the webhook is wired.

## 10. Risks / open items

- **Cart↔Razorpay correlation:** relies on the plugin putting the cart/session reference in Razorpay order `notes`. Verified the plugin writes notes; the exact key is confirmed in phase 2. Fallback: correlate via `payment_session.data.razorpay order_id` lookup.
- **Guest checkouts:** identified by `email` only; the dashboard groups by `customer_id ?? email`.
- **Webhook secret reuse:** the insights endpoint uses the same secret as the plugin endpoint — no new secret to manage.
- **Data volume:** append-only attempts table grows slowly (rows ≈ payment attempts); no cleanup needed short-term.
