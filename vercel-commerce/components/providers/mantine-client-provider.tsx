"use client";
import '@mantine/core/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { ReactNode } from 'react';

const theme = createTheme({
  components: {
    TextInput: {
      styles: (theme: any) => ({
        input: {
          backgroundColor: theme.colors.dark[6],
          color: theme.white,
          borderColor: theme.colors.dark[4],
        },
        label: {
          color: theme.white,
        },
      }),
    },
    Select: {
      styles: (theme: any) => ({
        input: {
          backgroundColor: theme.colors.dark[6],
          color: theme.white,
          borderColor: theme.colors.dark[4],
        },
        dropdown: {
          backgroundColor: theme.colors.dark[7],
          color: theme.white,
        },
        label: {
          color: theme.white,
        },
      }),
    },
    Checkbox: {
      styles: (theme: any) => ({
        input: {
          backgroundColor: theme.colors.dark[6],
          borderColor: theme.colors.dark[4],
        },
        label: {
          color: theme.white,
        },
      }),
    },
    Button: {
      styles: (theme: any) => ({
        root: {
          backgroundColor: theme.colors.dark[4],
          color: theme.white,
        },
      }),
    },
  },
});

export default function MantineClientProvider({ children }: { children: ReactNode }) {
  return <MantineProvider theme={theme} defaultColorScheme="dark">{children}</MantineProvider>;
}
