"use client";

import { useEffect, useState } from "react";
import { useCart } from "components/cart/cart-context";
import { useAccount } from "components/account/account-context";
import { sdk } from "@/lib/sdk/sdk";
import { INDIAN_STATES_WITH_CODES, getStateCode } from "@/components/checkout/indian-states";
import {
  TextInput,
  Select,
  Button,
  Stack,
  Grid,
  Checkbox,
  Alert,
  Title,
  Loader,
  Card,
  Text,
  Group,
  // Radio is no longer needed for the list view
  Badge,
} from "@mantine/core";
import { IconInfoCircle, IconHome, IconBuilding, IconMapPin, IconPlus, IconStar } from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import { BillingAddressFormData, ShippingAddressFormData } from "lib/checkout-schema";

const getAddressIcon = (label: string) => {
  if (label === "Home") return <IconHome size={24} color="var(--mantine-color-blue-6)" />;
  if (label === "Work") return <IconBuilding size={24} color="var(--mantine-color-blue-6)" />;
  return <IconMapPin size={24} color="var(--mantine-color-blue-6)" />;
};

interface SavedAddress {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  province: string;
  country_code: string;
  postal_code: string;
  phone: string;
  is_default_shipping: boolean;
}

interface ShippingStepProps {
  form: UseFormReturnType<ShippingAddressFormData>;
  billingForm: UseFormReturnType<BillingAddressFormData>;
  onComplete: (_values: ShippingAddressFormData) => void;
}

export function ShippingStep({ form, billingForm, onComplete }: ShippingStepProps) {
  const { cart, setCart } = useCart();
  const { isSdkReady } = useAccount();

  const [view, setView] = useState<"list" | "form">("list");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingSame, setBillingSame] = useState(true);

  useEffect(() => {
    if (isSdkReady) {
      sdk.store.customer.listAddress().then(({ addresses }) => {
        if (addresses && addresses.length > 0) {
          const mappedAddresses = addresses.map((addr: any) => ({
            id: addr.id || "",
            label: addr.metadata?.label || "Address",
            first_name: addr.first_name,
            last_name: addr.last_name,
            address_1: addr.address_1,
            city: addr.city,
            province: addr.province || "",
            country_code: addr.country_code,
            postal_code: addr.postal_code,
            phone: addr.phone,
            is_default_shipping: !!addr.is_default_shipping,
          }));
          
          const defaultAddress = mappedAddresses.find((addr) => addr.is_default_shipping);
          setSavedAddresses(mappedAddresses);
          setSelectedAddressId(defaultAddress?.id || mappedAddresses[0]?.id);
          setView("list");
        } else {
          setView("form");
        }
        setIsLoading(false);
      });
    } else {
      setView("form");
      setIsLoading(false);
    }
  }, [isSdkReady]);

  // ... (All handler functions remain the same)
  const getCountryCode = (name: string) => {
    return cart?.region?.countries?.find((c: any) => c.display_name === name)?.iso_2 || "IN";
  };
  const handleContinue = async () => {
    if (view === "list") {
      await handleSelectSavedAddress();
    } else {
      await handleSaveFormAddress();
    }
  };
  const handleSaveFormAddress = async () => {
    if (!cart) return;
    if (!form.isValid()) {
      form.validate();
      return;
    }
    if (!billingSame && !billingForm.isValid()) {
      billingForm.validate();
      return;
    }
    setIsSubmitting(true);
    const stateCode = form.values.state ? getStateCode(form.values.state) : undefined;
    const shippingAddress = {
      first_name: form.values.firstName,
      last_name: form.values.lastName,
      address_1: form.values.address,
      city: form.values.city,
      province: stateCode || form.values.state,
      postal_code: form.values.postalCode,
      country_code: getCountryCode(form.values.country),
      phone: form.values.phone,
    };
    const billingStateCode = billingForm.values.state ? getStateCode(billingForm.values.state) : undefined;
    const billingData = billingSame ? shippingAddress : {
      first_name: billingForm.values.firstName,
      last_name: billingForm.values.lastName,
      address_1: billingForm.values.address,
      city: billingForm.values.city,
      province: billingStateCode || billingForm.values.state,
      postal_code: billingForm.values.postalCode,
      country_code: getCountryCode(billingForm.values.country),
      phone: billingForm.values.phone,
    };
    try {
      await Promise.all([
        fetch("/api/cart/shipping-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartId: cart.id, shipping_address: shippingAddress }),
        }),
        fetch("/api/cart/billing-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartId: cart.id, billing_address: billingData }),
        }),
      ]);
      const res = await fetch("/api/cart");
      if (res.ok) setCart(await res.json());
      onComplete(form.values);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSelectSavedAddress = async () => {
    if (!cart || !selectedAddressId) return;
    setIsSubmitting(true);
    const selectedAddress = savedAddresses.find((addr) => addr.id === selectedAddressId);
    if (!selectedAddress) {
      setIsSubmitting(false);
      return;
    }
    const addressPayload = {
      first_name: selectedAddress.first_name,
      last_name: selectedAddress.last_name,
      address_1: selectedAddress.address_1,
      city: selectedAddress.city,
      province: selectedAddress.province,
      postal_code: selectedAddress.postal_code,
      country_code: selectedAddress.country_code,
      phone: selectedAddress.phone,
    };
    try {
      await Promise.all([
        fetch("/api/cart/shipping-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartId: cart.id, shipping_address: addressPayload }),
        }),
        fetch("/api/cart/billing-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartId: cart.id, billing_address: addressPayload }),
        }),
      ]);
      const res = await fetch("/api/cart");
      if (res.ok) setCart(await res.json());
      const countryName = cart.region?.countries?.find((c: any) => c.iso_2 === selectedAddress.country_code)?.display_name || "";
      
      // Get state name from state code for form completion
      const stateName = INDIAN_STATES_WITH_CODES.find(s => s.code === selectedAddress.province)?.name || selectedAddress.province || "";
      
      onComplete({
        firstName: selectedAddress.first_name,
        lastName: selectedAddress.last_name,
        address: selectedAddress.address_1,
        city: selectedAddress.city,
        state: stateName,
        postalCode: selectedAddress.postal_code,
        country: countryName,
        phone: selectedAddress.phone || "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return <Stack align="center" p="xl"><Loader /></Stack>;
  }

  const countryOptions =
    cart?.region?.countries?.map((c: any) => ({
      value: c.display_name,
      label: c.display_name,
    })) || [];

  return (
    <Stack>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        We use this address to calculate shipping and taxes.
      </Alert>

      {view === "list" && isSdkReady ? (
        <Stack>
          <Title order={5}>Choose a Shipping Address</Title>
          <Stack gap="sm">
            {savedAddresses.map((addr) => (
              <Card
                key={addr.id}
                padding="md"
                radius="md"
                withBorder
                // --- Changes Start Here ---
                onClick={() => setSelectedAddressId(addr.id)}
                style={{
                  cursor: "pointer",
                  borderColor:
                    selectedAddressId === addr.id
                      ? "var(--mantine-color-blue-6)"
                      : undefined,
                  backgroundColor:
                    selectedAddressId === addr.id
                      ? "var(--mantine-color-dark-6)"
                      : undefined,
                }}
              >
                <Group align="flex-start" gap="md">
                  {getAddressIcon(addr.label)}
                  <div>
                    <Group gap="xs">
                      <Text fw={500}>{addr.label}</Text>
                      {addr.is_default_shipping && (
                        <Badge size="sm" color="yellow" leftSection={<IconStar size={12} />}>
                          Default
                        </Badge>
                      )}
                    </Group>
                    <Text size="sm">{addr.first_name} {addr.last_name}</Text>
                    <Text size="sm" c="dimmed">
                      {addr.address_1}, {addr.city} {addr.postal_code}
                    </Text>
                  </div>
                </Group>
                 {/* --- Changes End Here --- */}
              </Card>
            ))}
          </Stack>
          <Button leftSection={<IconPlus size={16} />} variant="outline" onClick={() => setView("form")}>
            Add New Address
          </Button>
        </Stack>
      ) : (
        <>
          {/* ... (The form view remains unchanged) ... */}
          <Stack>
            <Group justify="space-between">
              <Title order={5}>Shipping Address</Title>
              {isSdkReady && savedAddresses.length > 0 && (
                <Button variant="subtle" size="xs" onClick={() => setView("list")}>
                  Choose a saved address
                </Button>
              )}
            </Group>
            
            <Grid>
              <Grid.Col span={6}>
                <TextInput label="First Name" placeholder="Enter first name" required {...form.getInputProps("firstName")} />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label="Last Name" placeholder="Enter last name" required {...form.getInputProps("lastName")} />
              </Grid.Col>
            </Grid>
            <TextInput label="Address Line 1" placeholder="Enter your address" required {...form.getInputProps("address")} />
            <Grid>
              <Grid.Col span={6}>
                <TextInput label="City" placeholder="Enter city" required {...form.getInputProps("city")} />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="State/Province"
                  placeholder="Select state"
                  data={INDIAN_STATES_WITH_CODES.map(s => ({ value: s.name, label: s.name }))}
                  searchable
                  required
                  {...form.getInputProps("state")}
                />
              </Grid.Col>
            </Grid>
            <Grid>
              <Grid.Col span={6}>
                <TextInput label="Postal Code" placeholder="Enter postal code" required {...form.getInputProps("postalCode")}
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, "").slice(0, 6);
                    form.setFieldValue("postalCode", value);
                  }}
                />
              </Grid.Col>
              <Grid.Col span={6}></Grid.Col>
            </Grid>
            <Select label="Country" placeholder="Select country" data={countryOptions} required searchable {...form.getInputProps("country")} />
            <TextInput label="Phone Number" placeholder="Enter phone number" required {...form.getInputProps("phone")}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "").slice(0, 10);
                form.setFieldValue("phone", value);
              }}
            />
            <Checkbox label="Billing address same as shipping address" checked={billingSame} onChange={(e) => setBillingSame(e.currentTarget.checked)} />
            
            {!billingSame && (
              <>
                <Title order={5} mt="md">Billing Address</Title>
                <Grid>
                  <Grid.Col span={6}>
                    <TextInput label="First Name" placeholder="Enter first name" required {...billingForm.getInputProps("firstName")} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput label="Last Name" placeholder="Enter last name" required {...billingForm.getInputProps("lastName")} />
                  </Grid.Col>
                </Grid>
                <TextInput label="Address Line 1" placeholder="Enter your address" required {...billingForm.getInputProps("address")} />
                <Grid>
                  <Grid.Col span={6}>
                    <TextInput label="City" placeholder="Enter city" required {...billingForm.getInputProps("city")} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      label="State/Province"
                      placeholder="Select state"
                      data={INDIAN_STATES_WITH_CODES.map(s => ({ value: s.name, label: s.name }))}
                      searchable
                      required
                      {...billingForm.getInputProps("state")}
                    />
                  </Grid.Col>
                </Grid>
                <Grid>
                  <Grid.Col span={6}>
                    <TextInput label="Postal Code" placeholder="Enter postal code" required {...billingForm.getInputProps("postalCode")}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                        billingForm.setFieldValue("postalCode", value);
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}></Grid.Col>
                </Grid>
                <Select label="Country" placeholder="Select country" data={countryOptions} searchable required {...billingForm.getInputProps("country")} />
                <TextInput label="Phone Number" placeholder="Enter phone number" required {...billingForm.getInputProps("phone")}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    billingForm.setFieldValue("phone", value);
                  }}
                />
              </>
            )}
          </Stack>
        </>
      )}

      <Button size="md" loading={isSubmitting} onClick={handleContinue} mt="md"
        disabled={ isSubmitting || (view === 'list' && !selectedAddressId) }
      >
        Continue to Delivery
      </Button>
    </Stack>
  );
}