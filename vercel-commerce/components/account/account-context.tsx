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
}

const AccountContext = createContext<AccountContextType>({
  token: undefined,
  setToken: async () => {},
});

interface AccountProviderProps {
  children: ReactNode;
  token: string;
}

export function AccountProvider({ children, token: _token }: AccountProviderProps) {
  const [token, setToken] = useState<string>(_token);

  // Update token to the provided token
  useEffect(() => {
    if (token?.length) sdk.client.setToken(token);
  }, [token]);

  return (
    <AccountContext.Provider
      value={{
        token,
        setToken
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}