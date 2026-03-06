"use client"

import {
  Container,
  Paper,
  Title,
  PasswordInput,
  Button,
  Stack,
  Text,
  Anchor,
  Alert,
} from "@mantine/core"
import { IconLock, IconInfoCircle, IconCheck } from "@tabler/icons-react"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

const MEDUSA_BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API || '';

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!token || !email) {
    return (
      <Container size="sm" py="xl">
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
            Invalid or missing reset link. Please request a new password reset.
          </Alert>
          <Text ta="center" size="sm" mt="md">
            <Anchor component={Link} href="/forgot-password" fw={500}>
              Request new reset link
            </Anchor>
          </Text>
        </Paper>
      </Container>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(
        `${MEDUSA_BACKEND}/auth/customer/emailpass/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || "Failed to reset password. The link may have expired.")
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || "Failed to reset password. Please try again.")
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
              Reset Password
            </Title>
            <Text c="dimmed" ta="center" mb="xl">
              Enter your new password below.
            </Text>
          </div>

          {error && (
            <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          {success ? (
            <>
              <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                Your password has been reset successfully. You can now sign in with your new password.
              </Alert>
              <Button
                component={Link}
                href="/login"
                size="md"
                fullWidth
              >
                Go to Sign In
              </Button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack>
                <PasswordInput
                  label="New Password"
                  placeholder="Enter new password"
                  leftSection={<IconLock size={16} />}
                  required
                  size="md"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  minLength={8}
                />

                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  leftSection={<IconLock size={16} />}
                  required
                  size="md"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                  minLength={8}
                />

                <Button
                  type="submit"
                  size="md"
                  loading={isLoading}
                  disabled={!password || !confirmPassword}
                  fullWidth
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Container size="sm" py="xl">
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Text ta="center">Loading...</Text>
        </Paper>
      </Container>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
