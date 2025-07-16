/* eslint-disable no-unused-vars */
"use client"

import { useRouter } from "next/navigation"
import CheckoutPlaceOrderButton from "./checkout-button"
import { useState } from "react"
import {
  Stepper,
  Container,
  Paper,
  Title,
  Group,
  Button,
  Grid,
  Divider,
  Modal, // Import Modal
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { customZodResolver } from "lib/resolver"
import { IconMail, IconTruck, IconCreditCard, IconMapPin } from "@tabler/icons-react"
import {
  emailSchema,
  shippingAddressSchema,
  deliverySchema,
  paymentSchema,
  type EmailFormData,
  type ShippingAddressFormData,
  type DeliveryFormData,
  type PaymentFormData,
} from "lib/checkout-schema"
import { EmailStep } from "./step/email-step"
import { ShippingStep } from "./step/shipping-step"
import DeliveryStep from "./step/delivery-step"
import PaymentStep from "./step/payment-step"
import { OrderSummary } from "components/checkout/order-summary"
import { CheckoutSummary } from "components/checkout/checkout-summary"
import { useCart } from "components/cart/cart-context"

interface CheckoutData {
  email: EmailFormData | null
  shipping: ShippingAddressFormData | null
  delivery: DeliveryFormData | null
  payment: PaymentFormData | null
}

export function CheckoutStepper() {
  const { cart } = useCart()
  const [active, setActive] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [showOrderSummaryModal, setShowOrderSummaryModal] = useState(false) // State for modal
  const [isPlacingOrder, setIsPlacingOrder] = useState(false) // State for placing order loading
  const router = useRouter();
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    email: null,
    shipping: null,
    delivery: null,
    payment: null,
  })

  // Form instances for each step
  const emailForm = useForm<EmailFormData>({
    validate: customZodResolver(emailSchema),
    initialValues: { email: "" },
    validateInputOnChange: true,
  })
  const shippingForm = useForm<ShippingAddressFormData>({
    validate: customZodResolver(shippingAddressSchema),
    initialValues: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      phone: "",
    },
    validateInputOnChange: true,
  })
  const billingForm = useForm<ShippingAddressFormData>({
    validate: customZodResolver(shippingAddressSchema),
    initialValues: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      phone: "",
    },
    validateInputOnChange: true,
  })
  const deliveryForm = useForm<DeliveryFormData>({
    validate: customZodResolver(deliverySchema),
    initialValues: { selectedOption: "" },
    validateInputOnChange: true,
  })
  const paymentForm = useForm<PaymentFormData>({
    validate: customZodResolver(paymentSchema),
    initialValues: { provider: "" },
    validateInputOnChange: true,
  })

  const steps = [
    {
      label: "Email",
      icon: IconMail,
      description: "Enter your email address",
      form: emailForm,
      key: "email" as keyof CheckoutData,
    },
    {
      label: "Shipping",
      icon: IconMapPin,
      description: "Shipping address details",
      form: shippingForm,
      key: "shipping" as keyof CheckoutData,
    },
    {
      label: "Delivery",
      icon: IconTruck,
      description: "Choose delivery method",
      form: deliveryForm,
      key: "delivery" as keyof CheckoutData,
    },
    {
      label: "Payment",
      icon: IconCreditCard,
      description: "Select payment method",
      form: paymentForm,
      key: "payment" as keyof CheckoutData,
    },
  ]

  const canProceedToStep = (stepIndex: number) => {
    if (stepIndex === 0) return true
    return completedSteps.includes(stepIndex - 1)
  }

  const isStepCompleted = (stepIndex: number) => {
    return completedSteps.includes(stepIndex)
  }

  const handleStepComplete = (stepIndex: number, data: any) => {
    const step = steps[stepIndex];
    if (!step) return; // Prevents undefined

    const stepKey = step.key
    setCheckoutData((prev) => ({ ...prev, [stepKey]: data }))

    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps((prev) => [...prev, stepIndex])
    }

    // If it's the last step (Payment), open the modal
    if (stepIndex === steps.length - 1) {
      setShowOrderSummaryModal(true)
    } else {
      setActive(stepIndex + 1)
    }
  }

  const handlePlaceOrder = async () => {
    // This function will be called from the modal's "Place Order" button
    if (!cart) return // Ensure cart data is available

    setIsPlacingOrder(true)
    // Simulate API call for placing order
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Here you would integrate with your actual order placement logic
    console.log("Placing order with cart data:", cart)

    setIsPlacingOrder(false)
    setShowOrderSummaryModal(false)
    
  }

  const renderStepContent = () => {
    switch (active) {
      case 0:
        return <EmailStep form={emailForm} onComplete={() => handleStepComplete(0, emailForm.values)} />
      case 1:
        return (
          <ShippingStep
            form={shippingForm}
            billingForm={billingForm}
            onComplete={(data) => handleStepComplete(1, data)}
          />
        )
      case 2:
        return <DeliveryStep onComplete={(data) => handleStepComplete(2, data)} />
      case 3: // This is the Payment step
        return <PaymentStep onComplete={() => handleStepComplete(3, paymentForm.values)} />
      default:
        return null
    }
  }

  // The allRequiredStepsCompleted check is now primarily for enabling the final "Review Order" button
  // or for the modal's "Place Order" button, not for rendering the summary directly on the page.
  const allRequiredStepsCompleted =
    completedSteps.includes(0) && completedSteps.includes(1) && completedSteps.includes(2) && completedSteps.includes(3)

  return (
    <>
      <Container size="xl" py="xl">
        <Title order={1} ta="center" mb="xl">
          Checkout
        </Title>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper shadow="sm" p="xl" radius="md">
              <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false} size="sm" mb="xl">
                {steps.map((step, index) => (
                  <Stepper.Step
                    key={index}
                    label={step.label}
                    description={step.description}
                    icon={<step.icon size={18} />}
                    allowStepSelect={canProceedToStep(index)}
                    color={isStepCompleted(index) ? "green" : undefined}
                    loading={active === index}
                  />
                ))}
              </Stepper>
              <Divider my="xl" />
              {renderStepContent()}
              {active < steps.length && (
                <Group justify="space-between" mt="xl">
                  <Button variant="subtle" onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0}>
                    Back
                  </Button>
                </Group>
              )}
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <OrderSummary />
          </Grid.Col>
        </Grid>
      </Container>

      {/* Order Summary Modal */}
      <Modal
        opened={showOrderSummaryModal}
        onClose={() => setShowOrderSummaryModal(false)}
        title="Review Your Order"
        size="lg"
        centered
      >
        {/* CheckoutSummary now fetches its own data via useCart */}
        <CheckoutSummary />
        <Divider my="lg" />
        <Group justify="space-between" mt="xl">
          <Button variant="outline" onClick={() => setShowOrderSummaryModal(false)}>
            Back to Edit
          </Button>
          {/* Use your existing CheckoutPlaceOrderButton inside the modal */}
          <CheckoutPlaceOrderButton cart={cart} />
        </Group>
      </Modal>
    </>
  )
}
