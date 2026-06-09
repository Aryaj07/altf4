import ContactUs from '@/components/static/contact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Altf4 team. We are here to help with orders, support, and any questions about our gaming peripherals.'
};

const ContactPage = () => {
  return (
    <div>
      <main style={{ padding: '2rem', margin: '0 auto' }}>
        <ContactUs />
      </main>
    </div>
  );
};

export default ContactPage;
