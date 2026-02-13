export function TrustBar() {
  const badges = [
    {
      icon: (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <path d="M8 20h32v20H8z" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M40 28h8l6 6v6h-14v-12z" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="18" cy="44" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="46" cy="44" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M4 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: 'Free Shipping',
      description: 'On orders above ₹999'
    },
    {
      icon: (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect x="12" y="16" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M12 24h40" stroke="currentColor" strokeWidth="2" />
          <circle cx="32" cy="34" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M32 32v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: 'Secured Payment',
      description: '100% protected'
    },
    {
      icon: (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M32 20v12l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <text x="32" y="48" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">1Y</text>
        </svg>
      ),
      title: '1 Year Warranty',
      description: 'Full coverage'
    },
    {
      icon: (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect x="12" y="12" width="40" height="40" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="22" cy="22" r="2.5" fill="currentColor" />
          <circle cx="32" cy="22" r="2.5" fill="currentColor" />
          <circle cx="42" cy="22" r="2.5" fill="currentColor" />
          <circle cx="22" cy="32" r="2.5" fill="currentColor" />
          <circle cx="32" cy="32" r="2.5" fill="currentColor" />
          <circle cx="42" cy="32" r="2.5" fill="currentColor" />
          <circle cx="22" cy="42" r="2.5" fill="currentColor" />
          <circle cx="32" cy="42" r="2.5" fill="currentColor" />
          <circle cx="42" cy="42" r="2.5" fill="currentColor" />
        </svg>
      ),
      title: 'Free Skates',
      description: 'With keyboards & mice'
    },
    {
      icon: (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M32 20v12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M44 20l6-6M20 20l-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 16c0-2 2-4 4-4h12c2 0 4 2 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: '7 Days Replacement',
      description: 'For defective products'
    }
  ];

  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-6">
      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 dark:border-neutral-800 dark:bg-black">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 lg:gap-8">
          {badges.map((badge) => (
            <div key={badge.title} className="flex flex-col items-center gap-3 text-center">
              <div className="h-10 w-10 text-neutral-700 dark:text-neutral-300">
                {badge.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">{badge.title}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
