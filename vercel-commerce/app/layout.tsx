import Navbar from 'components/layout/navbar';
import { Inter } from 'next/font/google';
import { ReactNode, Suspense } from 'react';
import './globals.css';
import { CartProvider } from 'components/cart/cart-context';
import MantineClientProvider from 'components/providers/mantine-client-provider';
import { AccountProvider } from '@/components/account/account-context';
import { cookies } from 'next/headers';
import Banner from 'components/layout/navbar/banner';
import SnowfallEffect from '@/components/snowfall-effect';


const { TWITTER_CREATOR, TWITTER_SITE, SITE_NAME } = process.env;
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';

const siteDescription = 'Premium gaming peripherals and accessories. Shop high-performance keyboards, mice, and gaming gear at Altf4. Fast shipping across India.';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`
  },
  description: siteDescription,
  robots: {
    follow: true,
    index: true
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: baseUrl,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: siteDescription,
    images: [
      {
        url: `${baseUrl}/static/logo.svg`,
        width: 1200,
        height: 630,
        alt: SITE_NAME
      }
    ]
  },
  ...(TWITTER_CREATOR &&
    TWITTER_SITE && {
      twitter: {
        card: 'summary_large_image',
        creator: TWITTER_CREATOR,
        site: TWITTER_SITE,
        title: SITE_NAME,
        description: siteDescription,
        images: [`${baseUrl}/static/logo.svg`]
      }
    })
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

// Token provided here ot these props for the root layout
export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value || '';
  
  // Organization structured data
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: baseUrl,
    logo: `${baseUrl}/static/logo.svg`,
    sameAs: [
      // Add your social media profiles here
      // 'https://www.facebook.com/altf4gear',
      // 'https://twitter.com/altf4gear',
      // 'https://www.instagram.com/altf4gear',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      areaServed: 'IN',
      availableLanguage: 'English'
    }
  };

  // WebSite structured data with search action
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd)
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd)
          }}
        />
      </head>
      <body className="bg-neutral-50 text-black selection:bg-teal-300 dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white">
        <SnowfallEffect />
        <AccountProvider token={token}> 
          <MantineClientProvider>
            <CartProvider>
            <Banner />
              <Navbar />
              <Suspense>
                <main>{children}</main>
              </Suspense>
            </CartProvider>
          </MantineClientProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
