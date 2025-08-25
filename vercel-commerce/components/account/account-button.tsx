"use client";

import { useRouter } from "next/navigation";
import { UserIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AccountProvider, } from "./account-context";

type AccountButtonProps = {
  token: string;
};

export default function AccountButton({
  token,
  className,
}: AccountButtonProps & { className?: string }) {
  // Provider must wrap any component that calls useAccount()
  return (
    <AccountProvider token={token}>
      <AccountButtonInner className={className} />
    </AccountProvider>
  );
}

function AccountButtonInner({ className }: { className?: string }) {
  const router = useRouter();
  
  const handleClick = () => {
    router.push("/dashboard");
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Login or go to dashboard"
      className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white"
    >
      <UserIcon
        className={clsx("h-4 transition-all ease-in-out hover:scale-110 ", className)}
      />
    </button>
  );
}