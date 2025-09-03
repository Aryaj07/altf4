"use client";
import React from 'react';

const LegalPageStyles = () => {
  return (
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
  );
};

export default LegalPageStyles;
