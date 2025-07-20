import {
  Paper,
  Title,
  TextInput,
  Button,
  Group,
  Stack,
  Grid,
  ActionIcon,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconEdit,
  IconCheck,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { customZodResolver } from "lib/resolver";
import { profileSchema, type ProfileFormData } from "lib/auth-schema";
import { sdk } from "@/lib/sdk/sdk";

type ProfileInformationProps = {
  user: any;
  onUpdate: (_user: any) => void;
};

export default function ProfileInformation({ user, onUpdate }: ProfileInformationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<ProfileFormData>({
    validate: customZodResolver(profileSchema),
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.setValues({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSaveProfile = async (values: ProfileFormData) => {
    setIsLoading(true);
    setSuccess(false);
    try {
      const { customer } = await sdk.store.customer.update({
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phone,
      });
      onUpdate({
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        email: customer.email,
      });
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>Profile Information</Title>
        <ActionIcon variant="outline" onClick={() => setIsEditing(!isEditing)}>
          <IconEdit size={16} />
        </ActionIcon>
      </Group>
      {success && (
        <Alert icon={<IconCheck size={16} />} color="green" variant="light" mb="md">
          Profile updated successfully!
        </Alert>
      )}
      <form onSubmit={form.onSubmit(handleSaveProfile)}>
        <Stack>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="First Name"
                leftSection={<IconUser size={16} />}
                required
                disabled={!isEditing}
                {...form.getInputProps("firstName")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Last Name"
                leftSection={<IconUser size={16} />}
                required
                disabled={!isEditing}
                {...form.getInputProps("lastName")}
              />
            </Grid.Col>
          </Grid>
          <TextInput
            label="Email Address"
            leftSection={<IconMail size={16} />}
            required
            disabled={true}
            {...form.getInputProps("email")}
          />
          <TextInput
            label="Phone Number"
            leftSection={<IconPhone size={16} />}
            required
            disabled={!isEditing}
            {...form.getInputProps("phone")}
          />
          {isEditing && (
            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isLoading} disabled={!form.isValid()}>
                Save Changes
              </Button>
            </Group>
          )}
        </Stack>
      </form>
    </Paper>
  );
}