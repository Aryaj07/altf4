import { Carousel } from 'components/carousel';
import { ThreeItemGrid } from 'components/grid/three-items';
import Footer from 'components/layout/footer';
import { Suspense } from 'react';

export const runtime = 'edge';

export const revalidate = 43200; // 12 hours

export const metadata = {
  title: 'Altf4 Gear Store',
  description: 'Welcome to Altf4 Gear Store',
  openGraph: {
    type: 'website',
    title: 'Altf4 Gear Store',
    description: 'Welcome to Altf4 Gear Store',
    images: [
      {
        url: '/static/logo.svg', // This can be your logo for social sharing
        width: 800,
        height: 600,
        alt: 'Altf4 Gear Store Logo',
      }
    ],
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
