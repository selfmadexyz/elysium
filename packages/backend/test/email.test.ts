import { describe, expect, it } from 'bun:test';
import { deliverInBackground, resendTransport } from '@backend/lib/email';
import { logger } from '@backend/lib/logger';
import { verificationEmail } from '@backend/modules/auth/emails';

const email = verificationEmail({ email: 'ada@example.com', name: 'Ada' }, 'https://app.example.com/verify?token=abc');

describe('resendTransport', () => {
  it('posts the message to Resend with the API key', async () => {
    const requests: { authorization: string | null; body: Record<string, unknown> }[] = [];
    const server = Bun.serve({
      port: 0,
      async fetch(request) {
        requests.push({
          authorization: request.headers.get('authorization'),
          body: (await request.json()) as Record<string, unknown>,
        });
        return Response.json({ id: 'email-id' });
      },
    });
    try {
      await resendTransport('re_test', 'App <no-reply@example.com>', `http://127.0.0.1:${server.port}/emails`)(email);
    } finally {
      server.stop(true);
    }

    expect(requests).toHaveLength(1);
    expect(requests[0]?.authorization).toBe('Bearer re_test');
    expect(requests[0]?.body).toMatchObject({
      from: 'App <no-reply@example.com>',
      to: ['ada@example.com'],
      subject: email.subject,
    });
    expect(String(requests[0]?.body.text)).toContain('https://app.example.com/verify?token=abc');
  });

  it('rejects when Resend refuses the message', async () => {
    const server = Bun.serve({
      port: 0,
      fetch: () => Response.json({ message: 'domain is not verified' }, { status: 403 }),
    });
    try {
      await expect(
        resendTransport('re_test', 'a@b.c', `http://127.0.0.1:${server.port}/emails`)(email),
      ).rejects.toThrow('Resend responded with 403: {"message":"domain is not verified"}');
    } finally {
      server.stop(true);
    }
  });
});

describe('deliverInBackground', () => {
  it('logs delivery failures instead of rejecting the auth request', async () => {
    const errors: unknown[][] = [];
    const original = logger.error;
    logger.error = (...args) => {
      errors.push(args);
    };
    try {
      deliverInBackground(email, async () => {
        throw new Error('network down');
      });
      await Bun.sleep(0);
    } finally {
      logger.error = original;
    }

    expect(errors).toHaveLength(1);
    expect(errors[0]?.[0]).toBe('Email delivery failed');
    expect(errors[0]?.[2]).toEqual({ 'email.template': 'verify-email' });
  });
});

describe('auth emails', () => {
  it('escapes user-controlled names in HTML', () => {
    const message = verificationEmail(
      { email: 'x@example.com', name: '<img src=x onerror=alert(1)>' },
      'https://a.b/c?d=1&e=2',
    );

    expect(message.html).not.toContain('<img');
    expect(message.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(message.html).toContain('https://a.b/c?d=1&amp;e=2');
  });
});
