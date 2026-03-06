import { z } from "zod"

export const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
})

export const shippingAddressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().regex(/^\d{6}$/, "Postal code must be exactly 6 digits"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^\d{10,13}$/, "Phone number must be 10-13 digits"),
});

export const billingAddressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().regex(/^\d{6}$/, "Postal code must be exactly 6 digits"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^\d{10,13}$/, "Phone number must be 10-13 digits"),
});

/**
 * Normalize a phone number by stripping country code prefixes and leading zeros.
 * Returns a clean 10-digit Indian mobile number.
 */
export function normalizePhone(raw: string): string {
  // Strip all non-digits
  let digits = raw.replace(/\D/g, '');
  // Remove +91 or 91 prefix (Indian country code)
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  }
  // Remove leading 0 (trunk prefix)
  if (digits.startsWith('0') && digits.length > 10) {
    digits = digits.slice(1);
  }
  return digits;
}

export const deliverySchema = z.object({
  selectedOption: z.string().min(1, "Please select a delivery option"),
})


export const paymentSchema = z.object({
  provider: z.string().min(1, "Please select a payment provider"),
})

export type EmailFormData = z.infer<typeof emailSchema>
export type ShippingAddressFormData = z.infer<typeof shippingAddressSchema>
export type BillingAddressFormData = z.infer<typeof billingAddressSchema>
export type DeliveryFormData = z.infer<typeof deliverySchema>
export type PaymentFormData = z.infer<typeof paymentSchema>