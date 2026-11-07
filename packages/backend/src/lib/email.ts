import { env } from '@backend/env';
import { logger } from '@backend/lib/logger';
import { createTransport } from 'nodemailer';

export type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
  template: string;
};

export type EmailTransport = (email: Email) => Promise<void>;

export function smtpTransport(url: string, from: string): EmailTransport {
  const mailer = createTransport(
    { url, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 },
    { from },
  );
  return async ({ to, subject, text, html }) => {
    await mailer.sendMail({ to, subject, text, html });
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
  env.EMAIL_TRANSPORT === 'smtp' && env.SMTP_URL && env.EMAIL_FROM
    ? smtpTransport(env.SMTP_URL, env.EMAIL_FROM)
    : consoleTransport;

export function deliverInBackground(email: Email, send: EmailTransport = transport) {
  void send(email).catch((error: unknown) => {
    logger.error('Email delivery failed', error, { 'email.template': email.template });
  });
}
