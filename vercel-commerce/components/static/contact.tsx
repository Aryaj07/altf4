'use client';

import React from 'react';
import LegalPageStyles from '@/components/static/styles'; // Adjust the import path if needed

const ContactUs = () => {
  return (
    <>
      <LegalPageStyles />
      <div data-custom-class="body">
        <div>
          <div data-custom-class="title">
            <h1>CONTACT US</h1>
          </div>
          <div data-custom-class="subtitle">
            <strong>Last updated September 01, 2025</strong>
          </div>
          <br />
          <br />
          <br />
          <div style={{ lineHeight: 1.5 }}>
            <span data-custom-class="body_text">
              Have a question or need to get in touch? We would love to hear from you. You can reach us using the details below.
            </span>
          </div>
          <br />
          <div data-custom-class="heading_1">
            <h2>Our Contact Information</h2>
          </div>
          
          <div className="address-block">
            <p data-custom-class="body_text">
              <strong>Altf4</strong>
            </p>
            <p data-custom-class="body_text" style={{ marginTop: '20px' }}>
              <strong>Email:</strong>{' '}
              <a href="mailto:altf4gear@gmail.com" data-custom-class="link">
                altf4gear@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactUs;
