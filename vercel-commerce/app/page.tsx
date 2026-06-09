// import { Carousel } from 'components/carousel';
import { ThreeItemGrid } from 'components/grid/three-items';
import { CollectionShowcase } from 'components/homepage/collection-showcase';
// import { TrustBar } from 'components/homepage/trust-bar';
import Footer from 'components/layout/footer';
import { Suspense } from 'react';

export const revalidate = 60; // 60 seconds - webhooks handle instant updates

export const metadata = {
  title: 'Altf4 - Premium Gaming Keyboards, Mice & Accessories | India',
  description: 'Shop high-performance gaming peripherals at Altf4. Premium mechanical keyboards, gaming mice, and esports gear. Fast shipping across India. Free returns on all orders.',
  keywords: ['gaming keyboards', 'mechanical keyboards', 'gaming mice', 'esports gear', 'gaming peripherals India', 'custom keyboards'],
  openGraph: {
    type: 'website',
    title: 'Altf4 - Premium Gaming Peripherals | India',
    description: 'Shop high-performance gaming peripherals at Altf4. Premium mechanical keyboards, gaming mice, and esports gear.',
    images: [
      {
        url: '/static/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Altf4 Gaming Gear Store',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Altf4 - Premium Gaming Peripherals | India',
    description: 'Shop high-performance gaming peripherals at Altf4.',
    images: ['/static/logo.svg']
  }
};

function CollectionShowcaseSkeleton() {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-8">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="h-8 w-64 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array(3)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="h-[280px] animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900"
            />
          ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  return (
    <>
      <ThreeItemGrid />
      {/* <TrustBar /> */}
      <Suspense fallback={<CollectionShowcaseSkeleton />}>
        <CollectionShowcase />
      </Suspense>
      <Suspense>
        {/* <Carousel /> */}
        <Suspense>
          <Footer />
        </Suspense>
      </Suspense>
    </>
  );
}
