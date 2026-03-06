export default `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fb;">
    <tr>
      <td align="center" style="padding:20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:20px;background:#111827;">
              <div style="color:#ffffff;font-size:20px;font-weight:700;">Altf4gear</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:24px 28px;">
              <div style="font-size:22px;font-weight:600;text-align:center;margin-bottom:16px;">Reset Your Password</div>
              <div style="font-size:14px;line-height:22px;color:#374151;">
                Hi{{#if email}} {{email}}{{/if}},
              </div>
              <div style="font-size:14px;line-height:22px;color:#374151;margin-top:8px;">
                We received a request to reset your password. Click the button below to create a new password for your account.
              </div>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding:8px 28px 24px;">
              <a href="{{resetUrl}}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;">
                Reset Password
              </a>
            </td>
          </tr>

          <!-- URL fallback -->
          <tr>
            <td style="padding:0 28px 16px;">
              <div style="font-size:13px;color:#6b7280;line-height:20px;">
                Or copy and paste this URL into your browser:
              </div>
              <div style="font-size:12px;color:#2563eb;word-break:break-all;margin-top:4px;">
                <a href="{{resetUrl}}" style="color:#2563eb;text-decoration:none;">{{resetUrl}}</a>
              </div>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="padding:16px 28px;">
              <div style="font-size:12px;color:#9ca3af;line-height:18px;">
                This password reset link will expire soon for security reasons.
              </div>
              <div style="font-size:12px;color:#9ca3af;line-height:18px;margin-top:4px;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:14px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <div style="font-size:11px;color:#9ca3af;">&copy; {{year}} Altf4gear. All rights reserved.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
