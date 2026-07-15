const cartRecoveryTemplate = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:32px 40px 16px;">
                <h1 style="margin:0 0 8px;font-size:22px;">You left something behind, {{customerFirstName}}!</h1>
                <p style="margin:0;font-size:14px;color:#52525b;">
                  Your cart is saved and waiting. Complete your order before it's gone.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  {{#each items}}
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;" width="64">
                      {{#if thumbnail}}
                      <img src="{{thumbnail}}" alt="{{title}}" width="56" height="56" style="border-radius:6px;object-fit:cover;" />
                      {{/if}}
                    </td>
                    <td style="padding:12px 12px;border-bottom:1px solid #e4e4e7;font-size:14px;">
                      {{title}}<br/>
                      <span style="color:#71717a;font-size:12px;">Qty: {{quantity}}</span>
                    </td>
                    <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:14px;text-align:right;white-space:nowrap;">
                      {{line_total_formatted}}
                    </td>
                  </tr>
                  {{/each}}
                  <tr>
                    <td colspan="2" style="padding:16px 0 0;font-size:15px;font-weight:bold;">Total</td>
                    <td style="padding:16px 0 0;font-size:15px;font-weight:bold;text-align:right;">{{total_formatted}}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 32px;" align="center">
                <a href="{{cartUrl}}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:15px;padding:12px 32px;border-radius:6px;">
                  Complete your order
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 24px;border-top:1px solid #e4e4e7;">
                <p style="margin:0;font-size:12px;color:#a1a1aa;">
                  © {{year}} {{storeName}}. If you already completed your purchase, you can ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`

export default cartRecoveryTemplate
