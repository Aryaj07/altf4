"use client";

import { useRouter } from "next/navigation";
import { UserIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function AccountButton({ className }: { className?: string }) {
  const router = useRouter();

  const handleClick = async () => {
    try {
      // Use GET to check authentication
      const res = await fetch("/api/me", { method: "GET" });
      if (res.ok) {
        const { customer } = await res.json();
        if (customer?.id) {
          router.push("/dashboard");
          return;
        }
      }
      router.push("/login");
    } catch (err) {
      router.push("/login");
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Login or go to dashboard"
      className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white"
    >
      <UserIcon className={clsx('h-4 transition-all ease-in-out hover:scale-110 ', className)} />
    </button>
  );
}