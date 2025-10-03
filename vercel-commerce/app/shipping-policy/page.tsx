import ShippingPolicy from '@/components/static/shipping';
import Head from 'next/head';

const ShippingPage = () => {
  return (
    <div>
      <Head>
        <title>Return Policy - Altf4</title>
      </Head>
      <main style={{ padding: '2rem', margin: '0 auto' }}>
        <ShippingPolicy />
      </main>
    </div>
  );
};

export default ShippingPage;