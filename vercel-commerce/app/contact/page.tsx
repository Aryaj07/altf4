import ContactUs from '@/components/static/contact';
import Head from 'next/head';

const ContactPage = () => {
  return (
    <div>
      <Head>
        <title>Return Policy - Altf4</title>
      </Head>
      <main style={{ padding: '2rem', margin: '0 auto' }}>
        <ContactUs />
      </main>
    </div>
  );
};

export default ContactPage;