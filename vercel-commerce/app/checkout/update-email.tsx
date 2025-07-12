"use client" // include with Next.js 13+
import { useEffect, useState } from "react";
import { useCart } from "components/cart/cart-context";
import { TextInput, Button } from '@mantine/core';


export function UpdateEmail() {
  const { cart, setCart } = useCart();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (cart && !cart.items?.length) {
      // TODO redirect to another path
    }
  }, [cart])

  // Simple email regex for validation
  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const updateCartEmail = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (!cart) return;
    if (!email.length) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError(null);
    setLoading(true);
    setSuccess(false);

    fetch("/api/cart/update-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cartId: cart.id,
        email,
      }),
    })
      .then(async (res) => {
        let data = null;
        try {
          data = await res.json();
        } catch (err) {
          // Ignore JSON parse errors
        }
        return { ok: res.ok, data };
      })
      .then(async ({ ok, data }) => {
        if (ok && data && data.cart) {
          // Fetch the latest cart to ensure state is up to date
          const res = await fetch(`/api/cart`, { method: 'GET' });
          if (res.ok) {
            const latestCart = await res.json();
            setCart(latestCart);
          } else {
            setCart(data.cart); // fallback
          }
          setLocked(true);
          setSuccess(true);
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      {!cart && <span>Loading...</span>}
      {locked ? (
        <div className="flex flex-col gap-2">
          <TextInput
            type="email"
            label="Email"
            value={cart?.email || email}
            disabled
            className="mb-2 w-full"
          />
          <div className="flex items-center gap-2">
            {success && (
              <div className="text-green-600 dark:text-green-400 font-semibold">Email added successfully!</div>
            )}
            <Button
              size="xs"
              variant="subtle"
              color="blue"
              onClick={() => { setLocked(false); setSuccess(false); setEmail(cart?.email || ""); setEmailError(null); }}
              className="ml-auto"
            >
              Edit
            </Button>
          </div>
        </div>
      ) : (
        <>
          <TextInput
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            disabled={!cart || loading}
            onChange={(e) => {
              setEmail(e.target.value);
              if (!e.target.value) {
                setEmailError("Email is required");
              } else if (!validateEmail(e.target.value)) {
                setEmailError("Please enter a valid email address");
              } else {
                setEmailError(null);
              }
            }}
            required
            error={emailError}
            className="mb-2 w-full"
          />
          <Button
            fullWidth
            color="blue"
            className="font-semibold w-full"
            disabled={!cart || !email || !!emailError || loading}
            onClick={updateCartEmail}
            type="button"
            loading={loading}
          >
            Set Email
          </Button>
        </>
      )}
    </>
  );
}