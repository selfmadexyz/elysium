import type { Email } from '@backend/lib/email';

const appName = 'Elysium';

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character,
  );

function actionEmail({
  to,
  name,
  subject,
  intro,
  action,
  url,
  outro,
  template,
}: {
  to: string;
  name: string;
  subject: string;
  intro: string;
  action: string;
  url: string;
  outro: string;
  template: string;
}): Email {
  const greeting = `Hi ${name},`;
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f6f6f7;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px">
      <tr><td>
        <p style="margin:0 0 16px;font-weight:600;font-size:18px">${escapeHtml(appName)}</p>
        <p style="margin:0 0 16px">${escapeHtml(greeting)}</p>
        <p style="margin:0 0 24px">${escapeHtml(intro)}</p>
        <p style="margin:0 0 24px">
          <a href="${escapeHtml(url)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px">${escapeHtml(action)}</a>
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#555">${escapeHtml(outro)}</p>
        <p style="margin:0;font-size:13px;color:#555;word-break:break-all">${escapeHtml(url)}</p>
      </td></tr>
    </table>
  </body>
</html>`;
  const text = `${greeting}\n\n${intro}\n\n${action}: ${url}\n\n${outro}`;
  return { to, subject, text, html, template };
}

type Recipient = { email: string; name: string };

export const verificationEmail = (user: Recipient, url: string) =>
  actionEmail({
    to: user.email,
    name: user.name,
    subject: `Verify your email for ${appName}`,
    intro: 'Confirm your email address to finish setting up your account.',
    action: 'Verify email',
    url,
    outro: "This link expires in 1 hour. If you didn't create an account, you can ignore this email.",
    template: 'verify-email',
  });

export const resetPasswordEmail = (user: Recipient, url: string) =>
  actionEmail({
    to: user.email,
    name: user.name,
    subject: `Reset your ${appName} password`,
    intro: 'We received a request to reset your password.',
    action: 'Choose a new password',
    url,
    outro:
      "This link expires in 1 hour. If you didn't ask for a reset, you can ignore this email; your password stays the same.",
    template: 'reset-password',
  });

export const deleteAccountEmail = (user: Recipient, url: string) =>
  actionEmail({
    to: user.email,
    name: user.name,
    subject: `Confirm your ${appName} account deletion`,
    intro: 'Confirm that you want to permanently delete your account and all of its data.',
    action: 'Delete my account',
    url,
    outro:
      "This link expires in 1 hour. If you didn't ask for this, ignore this email and consider changing your password.",
    template: 'delete-account',
  });
