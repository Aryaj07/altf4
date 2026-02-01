import { Carousel } from 'components/carousel';
import { ThreeItemGrid } from 'components/grid/three-items';
import Footer from 'components/layout/footer';
import { Suspense } from 'react';

export const runtime = 'edge';

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

export default async function HomePage() {
  return (
    <>
      <ThreeItemGrid />
      <Suspense>
        <Carousel />
        <Suspense>
          <Footer />
        </Suspense>
      </Suspense>
    </>
  );
}
