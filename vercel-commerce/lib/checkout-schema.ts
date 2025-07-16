import { z } from "zod"

export const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
})

export const shippingAddressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().regex(/^\d{6}$/, "Postal code must be exactly 6 digits"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});

export const billingAddressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().regex(/^\d{6}$/, "Postal code must be exactly 6 digits"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});

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