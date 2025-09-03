import PrivacyPolicy from 'components/static/privacy';
import Head from 'next/head';

const PrivacyPage = () => {
  return (
    <div>
      <Head>
        <title>Privacy Policy - Altf4</title>
      </Head>
      <main style={{ padding: '2rem', margin: '0 auto' }}>
        <PrivacyPolicy />
      </main>
    </div>
  );
};

export default PrivacyPage;