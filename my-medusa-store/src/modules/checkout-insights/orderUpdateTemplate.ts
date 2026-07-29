const orderUpdateTemplate = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:32px 40px 16px;">
                <h1 style="margin:0 0 8px;font-size:22px;">Update on your order, {{customerFirstName}}</h1>
                <p style="margin:0;font-size:14px;color:#52525b;">
                  Order #{{orderDisplayId}}
                </p>
              </td>
            </tr>
            {{#if items.length}}
            <tr>
              <td style="padding:16px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  {{#each items}}
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;font-size:14px;">
                      {{title}}
                    </td>
                  </tr>
                  {{/each}}
                </table>
              </td>
            </tr>
            {{/if}}
            <tr>
              <td style="padding:16px 40px;font-size:14px;line-height:1.6;">
                {{{messageHtml}}}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 24px;border-top:1px solid #e4e4e7;">
                <p style="margin:0;font-size:12px;color:#a1a1aa;">
                  © {{year}} {{storeName}}
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

export default orderUpdateTemplate
