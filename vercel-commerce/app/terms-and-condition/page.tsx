import TermsAndConditions from '@/components/static/terms';
import Head from 'next/head';

const PrivacyPage = () => {
  return (
    <div>
      <Head>
        <title>Terms and Conditions - Altf4</title>
      </Head>
      <main style={{ padding: '2rem', margin: '0 auto' }}>
        <TermsAndConditions />
      </main>
    </div>
  );
};

export default PrivacyPage;