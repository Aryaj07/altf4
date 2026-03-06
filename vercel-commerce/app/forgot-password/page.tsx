"use client"

import {
  Container,
  Paper,
  Title,
  TextInput,
  Button,
  Stack,
  Text,
  Anchor,
  Alert,
} from "@mantine/core"
import { IconMail, IconInfoCircle, IconCheck } from "@tabler/icons-react"
import { useState } from "react"
import Link from "next/link"

const MEDUSA_BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API || '';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setError(null)

    try {
      // Call the Medusa generate reset password token endpoint
      const res = await fetch(
        `${MEDUSA_BACKEND}/auth/customer/emailpass/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email }),
        }
      )

      if (!res.ok) {
        // Don't reveal if email exists or not for security
        // Still show success message
      }

      setSuccess(true)
    } catch (err: any) {
      // Still show success for security — don't reveal if email exists
      setSuccess(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container size="sm" py="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Stack>
          <div>
            <Title order={1} ta="center" mb="md">
              Forgot Password
            </Title>
            <Text c="dimmed" ta="center" mb="xl">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </Text>
          </div>

          {error && (
            <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          {success ? (
            <Alert icon={<IconCheck size={16} />} color="green" variant="light">
              If an account exists with that email, you&apos;ll receive a password reset link shortly. Please check your inbox and spam folder.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack>
                <TextInput
                  label="Email Address"
                  placeholder="Enter your email"
                  leftSection={<IconMail size={16} />}
                  required
                  size="md"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  type="email"
                />

                <Button
                  type="submit"
                  size="md"
                  loading={isLoading}
                  disabled={!email}
                  fullWidth
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </Stack>
            </form>
          )}

          <Text ta="center" size="sm">
            Remember your password?{" "}
            <Anchor component={Link} href="/login" fw={500}>
              Sign in
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Container>
  )
}
