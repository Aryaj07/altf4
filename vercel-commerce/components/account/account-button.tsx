"use client";

import { useRouter } from "next/navigation";
import { UserIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useAccount } from "./account-context";

// The button no longer needs the token prop
export default function AccountButton({ className }: { className?: string }) {
  const router = useRouter();
  // The hook now gets the state from a parent provider
  const { isSdkReady } = useAccount();

  const handleClick = () => {
    if (isSdkReady) {
      router.push("/dashboard");
      return;
    }
    router.push("/login");
  };

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