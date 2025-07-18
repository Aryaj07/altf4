"use client"

import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Stack,
  Checkbox,
  Anchor,
  Text,
  Divider,
  Alert,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { customZodResolver } from "lib/resolver"
import { loginSchema, type LoginFormData } from "lib/auth-schema"
import { IconMail, IconLock, IconInfoCircle } from "@tabler/icons-react"
import { useState } from "react"
import Link from "next/link"

import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<LoginFormData>({
    validate: customZodResolver(loginSchema),
    initialValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validateInputOnChange: true,
  })

  const handleSubmit = async (values: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Authenticate the customer via /api/me POST (server sets cookie)
      const res = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Invalid email or password. Please try again.");
      }
      const { customer } = await res.json();

      // Optionally transfer cart if needed (if you want to keep this logic)
      const cartResponse = await fetch(`/api/cart`);
      const cartData = await cartResponse.json();
      const cartId = cartData.id;
      console.log("Cart ID:", cartId);

      await fetch("/api/cart/transfer-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId }),
      });

      console.log("Login successful:", customer);

      // Redirect to dashboard or home page
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(
        err?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Container size="sm" py="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Stack>
          <div>
            <Title order={1} ta="center" mb="md">
              Welcome Back
            </Title>
            <Text c="dimmed" ta="center" mb="xl">
              Sign in to your account to continue
            </Text>
          </div>

          {error && (
            <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Email Address"
                placeholder="Enter your email"
                leftSection={<IconMail size={16} />}
                required
                size="md"
                {...form.getInputProps("email")}
              />

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                leftSection={<IconLock size={16} />}
                required
                size="md"
                {...form.getInputProps("password")}
              />

              <Group justify="space-between">
                <Checkbox label="Remember me" {...form.getInputProps("rememberMe", { type: "checkbox" })} />
                <Anchor component={Link} href="/forgot-password" size="sm">
                  Forgot password?
                </Anchor>
              </Group>

              <Button type="submit" size="md" loading={isLoading} disabled={!form.isValid()} fullWidth>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </Stack>
          </form>

          <Divider />


          <Text ta="center" size="sm">
            {"Don't have an account? "}
            <Anchor component={Link} href="/signup" fw={500}>
              Sign up here
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Container>
  )
}