'use client';

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createUrl } from 'lib/utils';

const MEDUSA_BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API || '';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || '';

type AlgoliaHit = {
  objectID: string;
  id: string;
  title: string;
  description?: string;
  handle: string;
  thumbnail?: string;
  categories?: { id: string; name: string; handle: string }[];
  tags?: { id: string; value: string }[];
};

export default function AlgoliaSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<AlgoliaHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Clear search and close on route change
  useEffect(() => {
    setQuery('');
    setHits([]);
    setIsOpen(false);
  }, [searchParams]);

  const searchAlgolia = useCallback(async (q: string) => {
    if (!q.trim()) {
      setHits([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${MEDUSA_BACKEND}/store/products/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ query: q }),
      });

      if (res.ok) {
        const data = await res.json();
        const results = data?.results?.[0]?.hits || [];
        setHits(results);
        setIsOpen(results.length > 0);
      }
    } catch (err) {
      console.error('Algolia search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchAlgolia(val);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsOpen(false);
    const newParams = new URLSearchParams(searchParams.toString());
    if (query) {
      newParams.set('q', query);
    } else {
      newParams.delete('q');
    }
    router.push(createUrl('/search', newParams));
  };

  return (
    <div ref={containerRef} className="relative w-max-[550px] w-full lg:w-80 xl:w-full">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="search"
          placeholder="Search for products..."
          autoComplete="off"
          value={query}
          onChange={handleChange}
          onFocus={() => hits.length > 0 && setIsOpen(true)}
          className="w-full rounded-lg border bg-white px-4 py-2 text-sm text-black placeholder:text-neutral-500 dark:border-neutral-800 dark:bg-transparent dark:text-white dark:placeholder:text-neutral-400"
        />
        <div className="absolute right-0 top-0 mr-3 flex h-full items-center">
          {query ? (
            <button
              type="button"
              onClick={() => { setQuery(''); setHits([]); setIsOpen(false); }}
              className="mr-1"
            >
              <XMarkIcon className="h-4 w-4 text-neutral-500" />
            </button>
          ) : null}
          <MagnifyingGlassIcon className="h-4" />
        </div>
      </form>

      {/* Instant search dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600" />
            </div>
          ) : (
            <ul>
              {hits.map((hit) => (
                <li key={hit.objectID}>
                  <Link
                    href={`/product/${hit.handle}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {hit.thumbnail ? (
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                        <Image
                          src={hit.thumbnail}
                          alt={hit.title}
                          fill
                          className="object-contain"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 flex-shrink-0 rounded-md bg-neutral-200 dark:bg-neutral-700" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black dark:text-white truncate">
                        {hit.title}
                      </p>
                      {hit.categories?.[0] && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {hit.categories[0].name}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
              {/* "View all" link */}
              <li>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    const newParams = new URLSearchParams();
                    newParams.set('q', query);
                    router.push(createUrl('/search', newParams));
                  }}
                  className="flex w-full items-center justify-center px-4 py-3 text-sm font-medium text-blue-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700"
                >
                  View all results for &quot;{query}&quot;
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
