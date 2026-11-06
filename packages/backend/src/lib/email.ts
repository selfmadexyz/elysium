import { env } from '@backend/env';
import { logger } from '@backend/lib/logger';

export type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
  template: string;
};

export type EmailTransport = (email: Email) => Promise<void>;

const resendEndpoint = 'https://api.resend.com/emails';

export function resendTransport(apiKey: string, from: string, endpoint = resendEndpoint): EmailTransport {
  return async ({ to, subject, text, html }) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Resend responded with ${response.status}: ${detail.slice(0, 500)}`);
    }
  };
}

export const consoleTransport: EmailTransport = async ({ to, subject, text, template }) => {
  if (env.NODE_ENV === 'production') {
    logger.warn('Email not sent: EMAIL_TRANSPORT is console', { 'email.template': template });
    return;
  }
  logger.info(`Email to ${to}: ${subject}\n${text}`, { 'email.template': template });
};

const transport: EmailTransport =
  env.EMAIL_TRANSPORT === 'resend' && env.RESEND_API_KEY && env.EMAIL_FROM
    ? resendTransport(env.RESEND_API_KEY, env.EMAIL_FROM)
    : consoleTransport;

export function deliverInBackground(email: Email, send: EmailTransport = transport) {
  void send(email).catch((error: unknown) => {
    logger.error('Email delivery failed', error, { 'email.template': email.template });
  });
}
