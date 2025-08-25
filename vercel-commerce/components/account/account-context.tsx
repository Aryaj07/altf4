// account-context.tsx

"use client";

import React, {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
  useEffect,
} from "react";
import {sdk} from "@/lib/sdk/sdk"

interface AccountContextType {
  token?: string;
  setToken?: Dispatch<SetStateAction<string>>;
  isSdkReady: boolean; // Add this new state
}

const AccountContext = createContext<AccountContextType>({
  token: undefined,
  setToken: async () => {},
  isSdkReady: false, // Default to false
});

interface AccountProviderProps {
  children: ReactNode;
  token: string;
}

export function AccountProvider({ children, token: _token }: AccountProviderProps) {
  const [token, setToken] = useState<string>(_token);
  const [isSdkReady, setIsSdkReady] = useState(false); // Add state for SDK readiness

  // Update token and readiness state
  useEffect(() => {
    if (token?.length) {
      sdk.client.setToken(token);
      setIsSdkReady(true); // Set SDK to ready only after token is set
    } else {
      setIsSdkReady(false);
    }
  }, [token]);

  return (
    <AccountContext.Provider
      value={{
        token,
        setToken,
        isSdkReady, // Provide the readiness state
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}