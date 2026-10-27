/**
 * Merge customer accounts whose emails differ only by case
 *
 * Follow-up to lowercase-emails.ts, which skips these pairs (e.g.
 * "Name@gmail.com" + "name@gmail.com" created by the same person signing up
 * twice). For each pair, one account is kept and the other is merged into it:
 *
 *   - orders and saved addresses move to the kept customer
 *   - the duplicate's login (auth identity) is deleted
 *   - the duplicate customer is soft-deleted
 *   - the kept login and customer email are lowercased
 *
 * The kept account is the one with the most orders; on a tie, the one that
 * signed up most recently. Its password is the one that keeps working —
 * customers who only remember the other password can use "Forgot password".
 * Override the choice with keep=<customer_id> (repeatable).
 *
 * Dry run:  npx medusa exec ./src/scripts/merge-duplicate-emails.ts
 * Apply:    npx medusa exec ./src/scripts/merge-duplicate-emails.ts apply
 * Override: npx medusa exec ./src/scripts/merge-duplicate-emails.ts keep=cus_123 apply
 */
import { Modules } from "@medusajs/framework/utils"

type Account = {
  customer: any
  authIdentityId?: string
  providerIdentity?: any
  orders: any[]
  addresses: any[]
}

export default async function mergeDuplicateEmails({ container, args }: any) {
  const argList: string[] = args ?? []
  const apply = argList.includes("apply")
  const forcedKeeps = new Set(
    argList.filter((a) => a.startsWith("keep=")).map((a) => a.slice("keep=".length))
  )

  const authModule = container.resolve(Modules.AUTH)
  const customerModule = container.resolve(Modules.CUSTOMER)
  const orderModule = container.resolve(Modules.ORDER)

  console.log(apply ? "Applying changes...\n" : "DRY RUN (pass 'apply' to write changes)\n")

  // Registered customers grouped by lowercase email; only groups of 2+ matter.
  const customers = await customerModule.listCustomers(
    { has_account: true },
    { relations: ["addresses"] }
  )
  const groups = new Map<string, any[]>()
  for (const customer of customers) {
    if (!customer.email) continue
    const key = customer.email.trim().toLowerCase()
    groups.set(key, [...(groups.get(key) ?? []), customer])
  }
  const duplicates = [...groups.entries()].filter(([, group]) => group.length > 1)

  if (!duplicates.length) {
    console.log("No duplicate accounts found.")
    return
  }

  // Map customer id -> its emailpass login.
  const authIdentities = await authModule.listAuthIdentities(
    {},
    { relations: ["provider_identities"] }
  )
  const loginByCustomer = new Map<string, { authIdentityId: string; providerIdentity: any }>()
  for (const identity of authIdentities) {
    const customerId = identity.app_metadata?.customer_id as string | undefined
    const providerIdentity = identity.provider_identities?.find(
      (p: any) => p.provider === "emailpass"
    )
    if (customerId && providerIdentity) {
      loginByCustomer.set(customerId, { authIdentityId: identity.id, providerIdentity })
    }
  }

  for (const [email, group] of duplicates) {
    const orders = await orderModule.listOrders(
      { customer_id: group.map((c: any) => c.id) },
      { select: ["id", "display_id", "customer_id", "created_at"] }
    )

    const accounts: Account[] = group.map((customer: any) => ({
      customer,
      ...loginByCustomer.get(customer.id),
      orders: orders.filter((o: any) => o.customer_id === customer.id),
      addresses: customer.addresses ?? [],
    }))

    const forced = accounts.find((a) => forcedKeeps.has(a.customer.id))
    const keep =
      forced ??
      [...accounts].sort(
        (a, b) =>
          b.orders.length - a.orders.length ||
          new Date(b.customer.created_at).getTime() - new Date(a.customer.created_at).getTime()
      )[0]
    const merge = accounts.filter((a) => a !== keep)

    console.log(`=== ${email}`)
    for (const a of accounts) {
      console.log(
        `  ${a === keep ? "KEEP " : "MERGE"} ${a.customer.id}  ${a.customer.email}  ` +
          `signed up ${new Date(a.customer.created_at).toISOString().slice(0, 10)}  ` +
          `orders: ${a.orders.map((o: any) => "#" + o.display_id).join(", ") || "none"}  ` +
          `addresses: ${a.addresses.length}  login: ${a.authIdentityId ? "yes" : "MISSING"}`
      )
    }

    if (!keep.authIdentityId) {
      console.warn(`  SKIPPED: kept account has no login. Pick another with keep=<customer_id>`)
      continue
    }

    if (!apply) continue

    for (const a of merge) {
      if (a.orders.length) {
        await orderModule.updateOrders(
          a.orders.map((o: any) => ({ id: o.id, customer_id: keep.customer.id }))
        )
      }
      if (a.addresses.length) {
        await customerModule.updateCustomerAddresses(
          a.addresses.map((addr: any) => addr.id),
          { customer_id: keep.customer.id, is_default_shipping: false, is_default_billing: false }
        )
      }
      if (a.authIdentityId) {
        await authModule.deleteAuthIdentities([a.authIdentityId])
      }
      await customerModule.softDeleteCustomers([a.customer.id])
    }

    if (keep.providerIdentity && keep.providerIdentity.entity_id !== email) {
      await authModule.updateProviderIdentities([{ id: keep.providerIdentity.id, entity_id: email }])
    }
    if (keep.customer.email !== email) {
      await customerModule.updateCustomers(keep.customer.id, { email })
    }
    console.log(`  merged into ${keep.customer.id}`)
  }

  console.log(apply ? "\nDone." : `\n${duplicates.length} duplicate group(s) found`)
}
