'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { createUrl } from 'lib/utils';

// The main Search component, which we'll use as SearchProvider as well
export function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && searchParams) {
      setSearchValue(searchParams.get('q') || '');
    }
  }, [searchParams, mounted]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!mounted) return;

    const val = e.target as HTMLFormElement;
    const search = val.search as HTMLInputElement;
    const newParams = new URLSearchParams(searchParams.toString());

    if (search.value) {
      newParams.set('q', search.value);
    } else {
      newParams.delete('q');
    }

    router.push(createUrl('/search', newParams));
  }

  if (!mounted) {
    return (
      <div className="w-max-[550px] relative w-full lg:w-80 xl:w-full">
        <div className="w-full rounded-lg border bg-white/50 px-4 py-2 dark:border-neutral-800">
          <div className="h-5 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-max-[550px] relative w-full lg:w-80 xl:w-full">
      <input
        type="text"
        name="search"
        placeholder="Search for products..."
        autoComplete="off"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="w-full rounded-lg border bg-white px-4 py-2 text-sm text-black placeholder:text-neutral-500 dark:border-neutral-800 dark:bg-transparent dark:text-white dark:placeholder:text-neutral-400"
      />
      <div className="absolute right-0 top-0 mr-3 flex h-full items-center">
        <MagnifyingGlassIcon className="h-4" />
      </div>
    </form>
  );
}

// Export the Search component as both default and named export
export { Search as SearchProvider };
export default Search;
