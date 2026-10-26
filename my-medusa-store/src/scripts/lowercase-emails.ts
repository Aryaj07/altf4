/**
 * Lowercase existing customer emails
 *
 * Login is now case-insensitive (see normalizeEmailFields in
 * src/api/middlewares.ts), so emails are always sent lowercase. Accounts
 * registered earlier with capital letters (e.g. "Name@gmail.com") must be
 * migrated, or they can no longer log in.
 *
 * Updates emailpass provider identities (the login) and registered customers.
 * If two accounts differ only by case, both are skipped and reported so they
 * can be merged by hand.
 *
 * Dry run:  npx medusa exec ./src/scripts/lowercase-emails.ts
 * Apply:    npx medusa exec ./src/scripts/lowercase-emails.ts apply
 */
import { Modules } from "@medusajs/framework/utils"

const groupByLowercase = <T>(items: T[], getEmail: (item: T) => string) => {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = getEmail(item).trim().toLowerCase()
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return groups
}

export default async function lowercaseEmails({ container, args }: any) {
  const apply = (args ?? []).includes("apply")
  const authModule = container.resolve(Modules.AUTH)
  const customerModule = container.resolve(Modules.CUSTOMER)

  console.log(apply ? "Applying changes...\n" : "DRY RUN (pass 'apply' to write changes)\n")

  // Login identities
  const identities = await authModule.listProviderIdentities({ provider: "emailpass" })
  const identityUpdates: { id: string; entity_id: string }[] = []

  for (const [email, group] of groupByLowercase(identities, (i: any) => i.entity_id)) {
    if (group.length > 1) {
      console.warn(`CONFLICT (login): ${group.map((i: any) => i.entity_id).join(", ")} -> skipped`)
      continue
    }
    const identity: any = group[0]
    if (identity.entity_id !== email) {
      console.log(`login: ${identity.entity_id} -> ${email}`)
      identityUpdates.push({ id: identity.id, entity_id: email })
    }
  }

  // Registered customers (guest customers are only matched by cart/order email)
  const customers = await customerModule.listCustomers({ has_account: true })
  const customerUpdates: { id: string; email: string }[] = []

  for (const [email, group] of groupByLowercase(customers, (c: any) => c.email ?? "")) {
    if (!email) continue
    if (group.length > 1) {
      console.warn(`CONFLICT (customer): ${group.map((c: any) => `${c.email} (${c.id})`).join(", ")} -> skipped`)
      continue
    }
    const customer: any = group[0]
    if (customer.email !== email) {
      console.log(`customer: ${customer.email} -> ${email}`)
      customerUpdates.push({ id: customer.id, email })
    }
  }

  console.log(`\n${identityUpdates.length} login(s), ${customerUpdates.length} customer(s) to update`)

  if (!apply) return

  if (identityUpdates.length) {
    await authModule.updateProviderIdentities(identityUpdates)
  }
  for (const { id, email } of customerUpdates) {
    await customerModule.updateCustomers(id, { email })
  }

  console.log("Done.")
}
