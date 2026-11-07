import { describe, expect, it } from 'bun:test';
import { deliverInBackground, smtpTransport } from '@backend/lib/email';
import { logger } from '@backend/lib/logger';
import { verificationEmail } from '@backend/modules/auth/emails';

const email = verificationEmail({ email: 'ada@example.com', name: 'Ada' }, 'https://app.example.com/verify?token=abc');

type SmtpSession = { buffer: string; inData: boolean; from: string; to: string[]; body: string };
type ReceivedMail = { auth: string; from: string; to: string[]; body: string };

function fakeSmtpServer(rejectRecipients = false) {
  const received: ReceivedMail[] = [];
  let auth = '';
  const reply = (socket: { write: (data: string) => void }, line: string) => socket.write(`${line}\r\n`);
  const server = Bun.listen<SmtpSession>({
    hostname: '127.0.0.1',
    port: 0,
    socket: {
      open(socket) {
        socket.data = { buffer: '', inData: false, from: '', to: [], body: '' };
        reply(socket, '220 fake ESMTP');
      },
      data(socket, chunk) {
        const session = socket.data;
        session.buffer += chunk.toString();
        let end = session.buffer.indexOf('\r\n');
        while (end >= 0) {
          const line = session.buffer.slice(0, end);
          session.buffer = session.buffer.slice(end + 2);
          end = session.buffer.indexOf('\r\n');
          if (session.inData) {
            if (line === '.') {
              session.inData = false;
              received.push({ auth, from: session.from, to: session.to, body: session.body });
              reply(socket, '250 queued');
            } else {
              session.body += `${line}\n`;
            }
            continue;
          }
          const command = line.toUpperCase();
          if (command.startsWith('EHLO') || command.startsWith('HELO')) {
            socket.write('250-fake\r\n250 AUTH PLAIN\r\n');
          } else if (command.startsWith('AUTH PLAIN')) {
            auth = Buffer.from(line.slice('AUTH PLAIN '.length), 'base64').toString();
            reply(socket, '235 authenticated');
          } else if (command.startsWith('MAIL FROM')) {
            session.from = line;
            reply(socket, '250 ok');
          } else if (command.startsWith('RCPT TO')) {
            if (rejectRecipients) {
              reply(socket, '550 mailbox unavailable');
            } else {
              session.to.push(line);
              reply(socket, '250 ok');
            }
          } else if (command === 'DATA') {
            session.inData = true;
            reply(socket, '354 end with .');
          } else if (command === 'QUIT') {
            reply(socket, '221 bye');
            socket.end();
          } else {
            reply(socket, '250 ok');
          }
        }
      },
    },
  });
  return { server, received };
}

describe('smtpTransport', () => {
  it('authenticates with the SMTP_URL credentials and delivers both bodies, so any SMTP provider works', async () => {
    const { server, received } = fakeSmtpServer();
    try {
      await smtpTransport(`smtp://mailer:s3cret@127.0.0.1:${server.port}`, 'App <no-reply@example.com>')(email);
    } finally {
      server.stop(true);
    }

    expect(received).toHaveLength(1);
    expect(received[0]?.auth).toBe('\0mailer\0s3cret');
    expect(received[0]?.from).toContain('<no-reply@example.com>');
    expect(received[0]?.to).toEqual([expect.stringContaining('<ada@example.com>')]);
    expect(received[0]?.body).toContain(`Subject: ${email.subject}`);
    expect(received[0]?.body).toContain('text/plain');
    expect(received[0]?.body).toContain('text/html');
  });

  it('rejects when the server refuses the recipient, so the failure is logged instead of lost', async () => {
    const { server } = fakeSmtpServer(true);
    try {
      await expect(
        smtpTransport(`smtp://mailer:s3cret@127.0.0.1:${server.port}`, 'a@example.com')(email),
      ).rejects.toThrow('550');
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
