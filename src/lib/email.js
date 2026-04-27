// Transactional email via Resend.
//
// All sender addresses route through @wvnews.com domain that Resend has
// SPF/DKIM verified. Add new domains via the Resend dashboard, then use
// them as `from` here.
//
// Required env: RESEND_API_KEY
// Optional env: EMAIL_FROM_DEFAULT (defaults to "WV News <noreply@wvnews.com>")
//
// In development without RESEND_API_KEY set, sendEmail() logs the message
// instead of trying to deliver — keeps local /admin testing usable
// without a key in your .env.local.

import { Resend } from 'resend';

let cachedClient = null;

function getClient() {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

export async function sendEmail({ to, subject, html, text, from, replyTo, tags }) {
  if (!to) throw new Error('sendEmail requires `to`');
  if (!subject) throw new Error('sendEmail requires `subject`');

  const fromAddr = from || process.env.EMAIL_FROM_DEFAULT || 'WV News <noreply@wvnews.com>';
  const client = getClient();

  if (!client) {
    // Dev mode — print the message so the developer can spot-check the
    // body without needing a real API key. Returning a fake id matches
    // the Resend response shape, so callers don't need to special-case.
    console.log('[email:dev]', { from: fromAddr, to, subject, replyTo, tags });
    if (process.env.NODE_ENV !== 'production') {
      console.log('[email:dev:body]\n' + (text || html?.replace(/<[^>]+>/g, '') || ''));
    }
    return { id: `dev-${Date.now()}`, dev: true };
  }

  const { data, error } = await client.emails.send({
    from: fromAddr,
    to,
    subject,
    html,
    text,
    replyTo,
    tags: tags ? Object.entries(tags).map(([name, value]) => ({ name, value })) : undefined,
  });
  if (error) throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
  return data;
}

// ---- Templates ----

export function buildClaimEmail({ name, claimUrl, edition }) {
  const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,';
  const editionLine = edition ? ` (${edition})` : '';

  const text = `${greeting}

Your print subscription${editionLine} now includes free digital access to wvnews.com — premium articles, the e-edition, and our newsletters.

Activate it here:
${claimUrl}

This link signs you in and links your digital account to your print subscription. It works on any device.

If you didn't request this, you can ignore this email and nothing changes on your account.

— The WV News team`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#222;max-width:560px;margin:24px auto;padding:0 16px;line-height:1.55;">
  <h2 style="font-size:18px;color:#0e2a47;margin:0 0 12px;">Activate your digital access</h2>
  <p>${greeting}</p>
  <p>Your print subscription${editionLine} now includes free digital access to <strong>wvnews.com</strong> — premium articles, the e-edition, and our newsletters.</p>
  <p style="margin:24px 0;">
    <a href="${claimUrl}" style="display:inline-block;padding:11px 18px;background:#0e2a47;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Activate digital access</a>
  </p>
  <p style="font-size:13px;color:#555;">Or copy this link into your browser:<br><span style="color:#0e2a47;word-break:break-all;">${claimUrl}</span></p>
  <p style="font-size:13px;color:#555;">This link signs you in and links your digital account to your print subscription. It works on any device.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="font-size:12px;color:#888;">If you didn't request this, you can ignore this email and nothing changes on your account.</p>
  <p style="font-size:12px;color:#888;">— The WV News team</p>
</body></html>`;

  return { subject: 'Activate your digital access to wvnews.com', text, html };
}
