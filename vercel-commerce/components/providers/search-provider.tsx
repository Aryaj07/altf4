'use client';

import { PropsWithChildren } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function SearchProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return <>{children}</>;
}
