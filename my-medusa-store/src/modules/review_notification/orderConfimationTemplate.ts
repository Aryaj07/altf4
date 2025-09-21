// Handlebars template for order confirmation
export default `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Your order is confirmed</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .stack { display: block !important; width: 100% !important; }
      .img-sm { width: 56px !important; height: 56px !important; }
    }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  </style>
</head>
<body style="margin:0; padding:0; background:#f5f7fb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#111827;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    Order {{orderNumber}} confirmation and details.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td align="center" style="padding:24px; background:#111827;">
              <div style="color:#ffffff; font-size:20px; font-weight:700;">Altf4gear</div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 8px 28px;">
              <div style="font-size:18px; font-weight:600;">Hi {{customerFirstName}},</div>
              <div style="font-size:14px; line-height:22px; color:#374151; margin-top:6px;">
                Thanks for your order. Here is a summary of order
                <strong>
                  <span style="white-space:nowrap; word-break:keep-all; overflow-wrap:normal; display:inline-block;">{{orderNumber}}</span>
                </strong>.
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 20px 8px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb; border-radius:12px;">
                {{#each items}}
                <tr>
                  <td class="stack" width="88" valign="top" style="padding:14px;">
                    {{#if thumbnail}}
                      <img src="{{thumbnail}}" alt="{{title}}" width="64" height="64" class="img-sm" style="display:block; width:64px; height:64px; border-radius:8px; object-fit:cover; border:1px solid #e5e7eb;" />
                    {{else}}
                      <div role="img" aria-label="Product image placeholder" style="width:64px; height:64px; border-radius:8px; background:#f3f4f6; border:1px solid #e5e7eb;"></div>
                    {{/if}}
                  </td>
                  <td class="stack" valign="middle" style="padding:14px;">
                    <div style="font-size:15px; font-weight:600; color:#111827;">{{title}}</div>
                    <div style="font-size:13px; color:#6b7280; margin-top:4px;">Qty: {{quantity}}</div>
                  </td>
                  <td valign="middle" align="right" style="padding:14px; white-space:nowrap;">
                    <div style="font-size:13px; color:#374151;">{{unit_price_formatted}}</div>
                    <div style="font-size:13px; color:#111827; font-weight:600; margin-top:2px;">{{line_total_formatted}}</div>
                  </td>
                </tr>
                {{#unless @last}}<tr><td colspan="3" style="border-top:1px solid #f3f4f6;"></td></tr>{{/unless}}
                {{/each}}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="font-size:13px; color:#6b7280;">Subtotal</td><td align="right" style="font-size:13px;">{{totals.subtotal_formatted}}</td></tr>
                <tr><td style="font-size:13px; color:#6b7280;">Shipping</td><td align="right" style="font-size:13px;">{{totals.shipping_formatted}}</td></tr>
                <tr><td style="font-size:13px; color:#6b7280;">Tax</td><td align="right" style="font-size:13px;">{{totals.tax_formatted}}</td></tr>
                <tr><td style="font-size:14px; font-weight:700; color:#111827; padding-top:8px;">Total</td><td align="right" style="font-size:14px; font-weight:700; padding-top:8px;">{{totals.total_formatted}}</td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 24px 28px;">
              <div style="font-size:14px; font-weight:600; color:#111827; margin-bottom:6px;">Shipping address</div>
              <div style="font-size:13px; line-height:20px; color:#374151;">
                {{shippingAddress.full_name}}<br />
                {{shippingAddress.line1}}{{#if shippingAddress.line2}}<br />{{shippingAddress.line2}}{{/if}}<br />
                {{shippingAddress.city}}{{#if shippingAddress.province}}, {{shippingAddress.province}}{{/if}} {{shippingAddress.postal_code}}<br />
                {{shippingAddress.country}}
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:18px 16px 24px 16px; background:#f9fafb;">
              <div style="font-size:12px; color:#9ca3af; line-height:18px;">&copy; {{year}} Altf4gear</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;