"use client";

import { useState } from "react";
import { useCart } from "components/cart/cart-context";
import {
  TextInput,
  Select,
  Button,
  Stack,
  Grid,
  Checkbox,
  Alert,
  Title,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import { BillingAddressFormData, ShippingAddressFormData } from "lib/checkout-schema";

interface ShippingStepProps {
  form: UseFormReturnType<ShippingAddressFormData>;
  billingForm: UseFormReturnType<BillingAddressFormData>;
  onComplete: (values: ShippingAddressFormData) => void;
}

export function ShippingStep({ form, billingForm, onComplete }: ShippingStepProps) {
  const { cart, setCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [billingSame, setBillingSame] = useState(true);

  const getCountryCode = (name: string) => {
    return (
      cart?.region?.countries?.find((c: any) => c.display_name === name)
        ?.iso_2 || "IN"
    );
  };

  const handleSave = async () => {
    if (!cart) return;

    // Validate shipping form
    if (!form.isValid()) {
      form.validate();
      setLoading(false);
      return;
    }

    // Validate billing form if needed
    if (!billingSame && !billingForm.isValid()) {
      billingForm.validate();
      setLoading(false);
      return;
    }

    setLoading(true);

    const shippingAddress = {
      first_name: form.values.firstName,
      last_name: form.values.lastName,
      address_1: form.values.address,
      city: form.values.city,
      postal_code: form.values.postalCode,
      country_code: getCountryCode(form.values.country),
      phone: form.values.phone,
    };

    const billingData = billingSame
      ? shippingAddress
      : {
          first_name: billingForm.values.firstName,
          last_name: billingForm.values.lastName,
          address_1: billingForm.values.address,
          city: billingForm.values.city,
          postal_code: billingForm.values.postalCode,
          country_code: getCountryCode(billingForm.values.country),
          phone: billingForm.values.phone,
        };

    try {
      await fetch("/api/cart/shipping-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          shipping_address: shippingAddress,
        }),
      });

      await fetch("/api/cart/billing-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          billing_address: billingData,
        }),
      });

      const res = await fetch("/api/cart");
      if (res.ok) {
        const latestCart = await res.json();
        setCart(latestCart);
      }

      onComplete(form.values);
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return <span>Loading cart...</span>;

  const countryOptions =
    cart.region?.countries?.map((c: any) => ({
      value: c.display_name,
      label: c.display_name,
    })) || [];

  return (
    <Stack>
      <Alert
        icon={<IconInfoCircle size={16} />}
        color="blue"
        variant="light"
      >
        We use this address to calculate shipping and taxes.
      </Alert>

      <Title order={5}>Shipping Address</Title>

      <Grid>
        <Grid.Col span={6}>
          <TextInput
            label="First Name"
            placeholder="Enter first name"
            required
            {...form.getInputProps("firstName")}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Last Name"
            placeholder="Enter last name"
            required
            {...form.getInputProps("lastName")}
          />
        </Grid.Col>
      </Grid>

      <TextInput
        label="Address Line 1"
        placeholder="Enter your address"
        required
        {...form.getInputProps("address")}
      />

      <Grid>
        <Grid.Col span={6}>
          <TextInput
            label="City"
            placeholder="Enter city"
            required
            {...form.getInputProps("city")}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Postal Code"
            placeholder="Enter postal code"
            required
            {...form.getInputProps("postalCode")}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "").slice(0, 6);
              form.setFieldValue("postalCode", value);
            }}
          />
        </Grid.Col>
      </Grid>

      <Select
        label="Country"
        placeholder="Select country"
        data={countryOptions}
        required
        searchable
        {...form.getInputProps("country")}
      />

      <TextInput
        label="Phone Number"
        placeholder="Enter phone number"
        required
        {...form.getInputProps("phone")}
        onChange={(event) => {
          const value = event.target.value.replace(/\D/g, "").slice(0, 10);
          form.setFieldValue("phone", value);
        }}
      />

      <Checkbox
        label="Billing address same as shipping address"
        checked={billingSame}
        onChange={(e) => setBillingSame(e.currentTarget.checked)}
      />

      {!billingSame && (
        <>
          <Title order={5} mt="md">Billing Address</Title>

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="First Name"
                placeholder="Enter first name"
                required
                {...billingForm.getInputProps("firstName")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Last Name"
                placeholder="Enter last name"
                required
                {...billingForm.getInputProps("lastName")}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Address Line 1"
            placeholder="Enter your address"
            required
            {...billingForm.getInputProps("address")}
          />

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="City"
                placeholder="Enter city"
                required
                {...billingForm.getInputProps("city")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Postal Code"
                placeholder="Enter postal code"
                required
                {...billingForm.getInputProps("postalCode")}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  billingForm.setFieldValue("postalCode", value);
                }}
              />
            </Grid.Col>
          </Grid>

          <Select
            label="Country"
            placeholder="Select country"
            data={countryOptions}
            searchable
            required
            {...billingForm.getInputProps("country")}
          />

          <TextInput
            label="Phone Number"
            placeholder="Enter phone number"
            required
            {...billingForm.getInputProps("phone")}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 10);
              billingForm.setFieldValue("phone", value);
            }}
          />
        </>
      )}

      <Button
        size="md"
        loading={loading}
        onClick={handleSave}
        disabled={
          Object.keys(form.errors).length > 0 ||
          (!billingSame && Object.keys(billingForm.errors).length > 0) ||
          loading
        }
      >
        Continue to Delivery
      </Button>
    </Stack>
  );
}
