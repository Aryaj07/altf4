import React from 'react';
import LegalPageStyles from './styles';

const ReturnPolicy = () => {
  return (
    <>
      {/* This style block contains the unified styles for all legal pages.
        It ensures this page has the same dark theme and layout as your
        Terms & Conditions and Privacy Policy pages.
      */}

      <LegalPageStyles />
      <div data-custom-class="body">
        <div>
          <div style={{ textAlign: 'center' }}>
            <div data-custom-class="title" style={{ textAlign: 'left', lineHeight: '150%' }}>
              <strong><h1>RETURN POLICY</h1></strong>
            </div>
            <div style={{ textAlign: 'left', lineHeight: '150%' }}><br /></div>
            <div data-custom-class="subtitle" style={{ textAlign: 'left', lineHeight: '150%' }}>
              <span><strong>Last updated September 01, 2025</strong></span>
            </div>
            <div style={{ textAlign: 'left', lineHeight: '150%' }}><br /></div>
          </div>
          <div data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
            <span>Thank you for your purchase. We hope you are happy with your purchase. However, if you are not completely satisfied with your purchase for any reason, you may return it to us for store credit or an exchange. Please see below for more information on our return policy.</span>
          </div>
        </div>
        <div style={{ lineHeight: 1.5 }}><br /></div>
        <div>
          <div data-custom-class="heading_1" style={{ lineHeight: '115%' }}>
            <strong><h2>RETURNS</h2></strong>
          </div>
        </div>
        <div>
          <div data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
            <span>All returns must be postmarked within seven (7) days of the purchase date. All returned items must be in new and unused condition, with all original tags and labels attached.</span>
          </div>
        </div>
        <div style={{ lineHeight: 1.5 }}><br /></div>
        <div>
          <div data-custom-class="heading_1" style={{ lineHeight: 1.5 }}>
            <strong><h2>RETURN PROCESS</h2></strong>
          </div>
        </div>
        <div>
          <div data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
            <span>To return an item, please email customer service at altf4gear@gmail.com to obtain a Return Merchandise Authorization (RMA) number. After receiving an RMA number, place the item securely in its original packaging and include your Proof of Purchase, then mail your return to the following address:</span>
          </div>
          <div style={{ lineHeight: 1.1 }}><br /></div>
          <div className="address-block">
            <span data-custom-class="body_text">
              Altf4<br />
              Attn: Returns<br />
              RMA #<br />
              A/19, Shram Saphalya CHS LTD, Haridas Nagar, Shimpoli Road, Borivali (West)<br />
              Mumbai, Maharashtra 400092<br />
              India
            </span>
          </div>
        </div>
        <div style={{ lineHeight: 1.1 }}><br /></div>
        <div>
          <div data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
            <span>Please note, you will be responsible for all return shipping charges. We strongly recommend that you use a trackable method to mail your return. </span>
          </div>
          <div style={{ lineHeight: 1.5 }}><br /></div>
          <div data-custom-class="heading_1" style={{ lineHeight: 1.5 }}>
            <strong><h2>REFUNDS</h2></strong>
          </div>
          <div data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
            <span>After receiving your return and inspecting the condition of your item, we will process your return or exchange. Please allow at least fourteen (14) days from the receipt of your item to process your return or exchange. We will notify you by email when your return has been processed.</span>
          </div>
          <div style={{ lineHeight: 1.5 }}><br /></div>
          <div data-custom-class="heading_1" style={{ lineHeight: 1.5 }}>
            <strong><h2>EXCEPTIONS</h2></strong>
          </div>
          <div data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
            <span>The following items cannot be returned or exchanged:</span>
          </div>
          <div data-custom-class="body_text" style={{ lineHeight: 1.5 }}><br /></div>
          <ul>
            <li data-custom-class="body_text">One Time use items such as Skates, etc</li>
          </ul>
          <div data-custom-class="body_text" style={{ lineHeight: 1.5 }}><br /></div>
          <div data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
            <span>For defective or damaged products, please contact us at the contact details below to arrange a refund or exchange.</span>
          </div>
          <div style={{ lineHeight: 1.5 }}><br /></div>
          <div data-custom-class="heading_1" style={{ lineHeight: 1.5 }}>
            <strong><h2>QUESTIONS</h2></strong>
          </div>
          <div data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
            <span>If you have any questions concerning our return policy, please contact us at:</span>
          </div>
          <div data-custom-class="body_text" style={{ lineHeight: 1.1 }}><br /></div>
          <div data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
            <span>8169433053</span>
          </div>
          <div data-custom-class="body_text" style={{ lineHeight: 1.5 }}>
            <span>altf4gear@gmail.com</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReturnPolicy;
