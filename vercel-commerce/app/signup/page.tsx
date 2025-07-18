"use client"

import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Checkbox,
  Anchor,
  Text,
  Grid,
  Alert,
  Divider,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { customZodResolver } from "lib/resolver"
import { signupSchema, type SignupFormData } from "lib/auth-schema"
import {
  IconMail,
  IconLock,
  IconUser,
  IconPhone,
  IconInfoCircle,
  IconCheck,
} from "@tabler/icons-react"
import { useState } from "react"
import Link from "next/link"
import { sdk } from "lib/sdk"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()


  const form = useForm<SignupFormData>({
    validate: customZodResolver(signupSchema),
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      acceptTerms: false,
    },
    validateInputOnChange: true,
  })

  const handleSubmit = async (values: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Register the customer
      const token = await sdk.auth.register("customer", "emailpass", {
        email: values.email,
        password: values.password,
      });

      // Create the customer profile
      const { customer } = await sdk.store.customer.create(
        {
          email: values.email,
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone,
        },
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );


      console.log("Signup successful:", customer);
      setSuccess(true);

    } catch (err: any) {
      setError(
        err?.message ||
          "An error occurred during signup. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };


  if (success) {
    return (
      <Container size="sm" py="xl">
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Stack align="center">
            <IconCheck size={64} color="green" />
            <Title order={2} ta="center">
              Account Created Successfully!
            </Title>
            <Text c="dimmed" ta="center">
              Welcome! Your account has been created.{" "}
              <Anchor
                component={Link}
                href="/login"
                fw={500}
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/login");
                }}
              >
                Click here to login
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="md" py="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Stack>
          <div>
            <Title order={1} ta="center" mb="md">
              Create Your Account
            </Title>
            <Text c="dimmed" ta="center" mb="xl">
              Join us today and start your journey
            </Text>
          </div>

          {error && (
            <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="First Name"
                    placeholder="Enter your first name"
                    leftSection={<IconUser size={16} />}
                    required
                    size="md"
                    {...form.getInputProps("firstName")}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Last Name"
                    placeholder="Enter your last name"
                    leftSection={<IconUser size={16} />}
                    required
                    size="md"
                    {...form.getInputProps("lastName")}
                  />
                </Grid.Col>
              </Grid>

              <TextInput
                label="Email Address"
                placeholder="Enter your email"
                leftSection={<IconMail size={16} />}
                required
                size="md"
                {...form.getInputProps("email")}
              />

              <TextInput
                label="Phone Number"
                placeholder="Enter your phone number"
                leftSection={<IconPhone size={16} />}
                required
                size="md"
                {...form.getInputProps("phone")}
              />

              <Grid>
                <Grid.Col span={6}>
                  <PasswordInput
                    label="Password"
                    placeholder="Create a password"
                    leftSection={<IconLock size={16} />}
                    required
                    size="md"
                    {...form.getInputProps("password")}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    leftSection={<IconLock size={16} />}
                    required
                    size="md"
                    {...form.getInputProps("confirmPassword")}
                  />
                </Grid.Col>
              </Grid>

              <Checkbox
                label={
                  <Text size="sm">
                    I agree to the{" "}
                    <Anchor href="/terms" target="_blank">
                      Terms of Service
                    </Anchor>{" "}
                    and{" "}
                    <Anchor href="/privacy" target="_blank">
                      Privacy Policy
                    </Anchor>
                  </Text>
                }
                required
                {...form.getInputProps("acceptTerms", { type: "checkbox" })}
              />

              <Button type="submit" size="md" loading={isLoading} disabled={!form.isValid()} fullWidth>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </Stack>
          </form>

          <Divider />

          <Text ta="center" size="sm">
            Already have an account?{" "}
            <Anchor component={Link} href="/login" fw={500}>
              Sign in here
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Container>
  )
}
