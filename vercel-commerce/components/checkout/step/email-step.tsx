"use client";

import { useState, useEffect } from "react"; // Import useEffect
import { useCart } from "components/cart/cart-context";
import { useAccount } from "components/account/account-context"; // Import useAccount
import { sdk } from "@/lib/sdk/sdk"; // Import sdk
import { TextInput, Button, Stack, Alert, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { EmailFormData } from "lib/checkout-schema";
import type { UseFormReturnType } from "@mantine/form";

interface EmailStepProps {
  form: UseFormReturnType<EmailFormData>;
  onComplete: () => void;
}

export function EmailStep({ form, onComplete }: EmailStepProps) {
  const { cart, setCart } = useCart();
  const { isSdkReady } = useAccount(); // Use the account hook

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrefilled, setIsPrefilled] = useState(false); // State to prevent overwriting user edits

  // This new useEffect handles pre-filling the email for logged-in users
  useEffect(() => {
    // Only run if the user is logged in and we haven't pre-filled the email yet
    if (isSdkReady && !isPrefilled) {
      sdk.store.customer
        .retrieve()
        .then(({ customer }) => {
          if (customer?.email) {
            // Pre-fill the form with the user's email
            form.setFieldValue("email", customer.email);
            // Mark as pre-filled to ensure we don't overwrite manual edits
            setIsPrefilled(true);
          }
        })
        .catch((err) => console.error("Failed to fetch customer for email pre-fill:", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSdkReady, isPrefilled]);

  const updateCartEmail = async () => {
    if (!cart) return;
    if (!form.isValid()) {
      form.validate();
      return;
    }

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/cart/update-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartId: cart.id,
          email: form.values.email,
        }),
      });

      const data = await res.json();

      if (res.ok && data?.cart) {
        const refreshed = await fetch(`/api/cart`);
        if (refreshed.ok) {
          const latestCart = await refreshed.json();
          setCart(latestCart);
        } else {
          setCart(data.cart);
        }
        setSuccess(true);
        onComplete();
      } else {
        setError(data?.error || "Failed to update email.");
      }
    } catch (error) {
      console.error(error);
      setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!cart) {
    return <span>Loading cart...</span>;
  }

  return (
    <Stack>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        We&apos;ll use this email to send you order confirmations and updates.
      </Alert>

      <TextInput
        label="Email Address"
        placeholder="Enter your email address"
        required
        size="md"
        {...form.getInputProps("email")}
      />

      {error && (
        <Text size="sm" c="red">
          {error}
        </Text>
      )}

      {success && (
        <Text size="sm" c="green">
          Email updated successfully!
        </Text>
      )}

      <Button
        size="md"
        onClick={updateCartEmail}
        disabled={!form.values.email || !!form.errors.email || loading}
        loading={loading}
      >
        Continue to Shipping
      </Button>
    </Stack>
  );
}