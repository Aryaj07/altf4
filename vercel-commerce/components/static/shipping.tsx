'use client';

import React from 'react';

const ShippingPolicy = () => {
  return (
    <>
      <style jsx global>{`
        /* --- Main Layout --- */
        
        [data-custom-class='body'] {
          max-width: 1500px; /* Max width for readable text */
          margin: 0 auto;    /* Center the content */
          padding: 0 20px;    /* Space on the sides */
        }

        .address-block {
          background-color: #3a4b60;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
          line-height: 1.7;
        }
        
        /* --- Generated Content Overrides --- */
        [data-custom-class='body'] *:not(.address-block) {
          background: transparent !important;
        }

        /* --- Typography & Other Styles --- */
        [data-custom-class='title'],
        [data-custom-class='title'] * {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          font-size: 26px !important;
          color: #FFFFFF !important;
        }

        [data-custom-class='subtitle'],
        [data-custom-class='subtitle'] * {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          color: #B9B9B9 !important;
          font-size: 14px !important;
        }

        [data-custom-class='heading_1'],
        [data-custom-class='heading_1'] * {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          font-size: 19px !important;
          color: #FFFFFF !important;
        }

        [data-custom-class='heading_2'],
        [data-custom-class='heading_2'] * {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          font-size: 17px !important;
          color: #FFFFFF !important;
        }

        [data-custom-class='body_text'],
        [data-custom-class='body_text'] * {
          color: #D3D3D3 !important;
          font-size: 14px !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        }

        [data-custom-class='link'],
        [data-custom-class='link'] * {
          color: #8AB4F8 !important;
          font-size: 14px !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          word-break: break-word !important;
        }
        
        /* --- List Styles --- */
        [data-custom-class='body'] ul {
          list-style-type: square;
          padding-left: 40px;
        }

        [data-custom-class='body'] ul > li > ul {
          list-style-type: circle;
        }

        [data-custom-class='body'] ul > li > ul > li > ul {
          list-style-type: square;
        }

        ol li {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
    `}</style>
      <div data-custom-class="body">
        <div>
          <div data-custom-class="title">
            <h1>SHIPPING & DELIVERY POLICY</h1>
          </div>
          <div data-custom-class="subtitle">
            <strong>Last updated September 01, 2025</strong>
          </div>
          <br />
          <br />
          <br />
          <div style={{ lineHeight: 1.5 }}>
            <span data-custom-class="body_text">
              This Shipping & Delivery Policy is part of our Terms and Conditions (Terms) and should be therefore read alongside our main Terms:{' '}
              <a
                data-custom-class="link"
                href="/terms-and-condition"
              >
                Terms and Conditions
              </a>
              .
            </span>
          </div>
          <br />
          <div style={{ lineHeight: 1.5 }}>
            <span data-custom-class="body_text">
              Please carefully review our Shipping & Delivery Policy when purchasing our products. This policy will apply to any order you place with us.
            </span>
          </div>
          <br />
          <div data-custom-class="heading_1">
            <h2>1. WHAT ARE MY SHIPPING & DELIVERY OPTIONS?</h2>
          </div>
          
          <div style={{ paddingLeft: '20px' }}>
            <div style={{ marginTop: '20px' }}>
              <strong data-custom-class="heading_2"><h3>Shipping Options</h3></strong>
              <div style={{ paddingLeft: '20px', marginTop: '10px' }}>
                 <span data-custom-class="body_text">We offer the following shipping options:</span>
                 <ul>
                    <li><span data-custom-class="body_text"><strong>Standard Shipping:</strong> We offer Free Standard Shipping on orders above Rs 999/-.</span></li>
                    <li><span data-custom-class="body_text"><strong>Express Shipping:</strong> Available at an additional cost.</span></li>
                 </ul>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <strong data-custom-class="heading_2"><h3>Shipping Fees</h3></strong>
              <div style={{ paddingLeft: '20px', marginTop: '10px' }}>
                <span data-custom-class="body_text">
                  Shipping fees are calculated based on the following table:
                </span>
                <div style={{ marginTop: '15px' }}>
                  <table style={{ width: '100%', maxWidth: '500px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '33.3%' }}></th>
                        <th style={{ width: '33.3%', textAlign: 'center', padding: '8px', borderBottom: '1px solid #555' }}>
                          <span data-custom-class="body_text"><strong>Standard Shipping</strong></span>
                        </th>
                        <th style={{ width: '33.3%', textAlign: 'center', padding: '8px', borderBottom: '1px solid #555' }}>
                          <span data-custom-class="body_text"><strong>Express Shipping</strong></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th style={{ textAlign: 'center', padding: '8px' }}>
                          <span data-custom-class="body_text">Order Above Rs 999/-</span>
                        </th>
                        <td style={{ textAlign: 'center', padding: '8px' }}>
                          <span data-custom-class="body_text">Free</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px' }}>
                          <span data-custom-class="body_text">Rs 300/-</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div style={{ lineHeight: 1.5 }}><br /></div>
            <div style={{ lineHeight: 1.5 }}>
              <span data-custom-class="body_text">
                All times and dates given for delivery of the products are given in good faith but are estimates only.
              </span>
            </div>
            <br />
            <div>
              <div data-custom-class="heading_1">
                <h2>2. DO YOU DELIVER INTERNATIONALLY?</h2>
              </div>
            </div>
            <div>
              <div style={{ lineHeight: 1.5 }}>
                <span data-custom-class="body_text">
                  We do not offer international shipping at this time.
                </span>
              </div>
              <br />
              <div style={{ lineHeight: 1.5 }}>
                <div data-custom-class="heading_1">
                  <h2>3. WHAT HAPPENS IF MY ORDER IS DELAYED?</h2>
                </div>
              </div>
              <div style={{ lineHeight: 1.5 }}>
                <span data-custom-class="body_text">
                  If delivery is delayed for any reason we will let you know as soon as possible and will advise you of a revised estimated date for delivery.
                </span>
              </div>
              <br />
              <div style={{ lineHeight: 1.5 }}>
                <div data-custom-class="heading_1">
                  <h2>4. QUESTIONS ABOUT RETURNS?</h2>
                </div>
              </div>
              <div style={{ lineHeight: 1.5 }}>
                <span data-custom-class="body_text">
                  If you have questions about returns, please review our Return Policy:{' '}
                  <a
                    data-custom-class="link"
                    href="/returns"
                  >
                    Return Policy
                  </a>
                  .
                </span>
              </div>
              <br />
              <div style={{ lineHeight: 1.5 }}>
                <div data-custom-class="heading_1">
                  <h2>5. HOW CAN YOU CONTACT US ABOUT THIS POLICY?</h2>
                </div>
              </div>
              <div style={{ lineHeight: 1.5 }}>
                <span data-custom-class="body_text">
                  If you have any further questions or comments, you may contact us by:
                </span>
              </div>
              <ul>
                <li>
                  <span data-custom-class="body_text">
                    Email:{' '}
                    <a
                      data-custom-class="link"
                      href="mailto:altf4gear@gmail.com"
                    >
                      altf4gear@gmail.com
                    </a>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShippingPolicy;