import ReturnPolicy from '@/components/static/returns';
import Head from 'next/head';

const PrivacyPage = () => {
  return (
    <div>
      <Head>
        <title>Return Policy - Altf4</title>
      </Head>
      <main style={{ padding: '2rem', margin: '0 auto' }}>
        <ReturnPolicy />
      </main>
    </div>
  );
};

export default PrivacyPage;