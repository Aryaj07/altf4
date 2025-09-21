// Review request HTML email template (Handlebars)
// Expects:
// - customerFirstName: string
// - products: Array<{ product_title: string; product_thumbnail?: string; review_link?: string; }>
// - year: number
export default `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>How was your order?</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fb;">
    <tr>
      <td align="center" style="padding:20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:20px;background:#111827;">
              <div style="color:#ffffff;font-size:20px;font-weight:700;">Altf4gear</div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:20px;">
              <div style="font-size:18px;font-weight:600;margin-bottom:6px;">Hi {{customerFirstName}},</div>
              <div style="font-size:14px;line-height:20px;color:#374151;">
                Thanks for your order. Could you share a quick review of your items?
              </div>
            </td>
          </tr>

          <!-- Products -->
          {{#each products}}
          <tr>
            <td style="padding:12px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;">
                <tr>
                  <td width="96" valign="top" style="padding:12px;">
                    {{#if product_thumbnail}}
                      <img src="{{product_thumbnail}}" alt="{{product_title}}" width="80" height="80" style="display:block;width:80px;height:80px;border-radius:6px;object-fit:cover;border:1px solid #e5e7eb;" />
                    {{else}}
                      <div style="width:80px;height:80px;border-radius:6px;background:#f3f4f6;border:1px solid #e5e7eb;"></div>
                    {{/if}}
                  </td>
                  <td valign="middle" style="padding:12px;">
                    <div style="font-size:15px;font-weight:600;color:#111827;margin-bottom:8px;">{{product_title}}</div>
                    {{#if review_link}}
                      <a href="{{review_link}}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:8px 12px;border-radius:6px;">
                        Write a review
                      </a>
                    {{else}}
                      <span style="font-size:12px;color:#6b7280;">Review link not available.</span>
                    {{/if}}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {{/each}}

          <!-- Outro -->
          <tr>
            <td style="padding:16px 20px;">
              <div style="font-size:12px;line-height:18px;color:#6b7280;">
                Have a question? Just reply to support@altf4gear.com and our team will assist you.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:14px;background:#f9fafb;">
              <div style="font-size:11px;color:#9ca3af;">&copy; {{year}} Altf4gear</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;