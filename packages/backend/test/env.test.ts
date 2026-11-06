import { describe, expect, it } from 'bun:test';
import { parseEnv } from '@backend/env';

const validEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/elysium_test',
  PORT: '4321',
  BETTER_AUTH_SECRET: '0123456789abcdef0123456789abcdef',
  BETTER_AUTH_URL: 'http://localhost:3001',
  GOOGLE_CLIENT_ID: 'test-client',
  GOOGLE_CLIENT_SECRET: 'test-secret',
  APP_URL: 'http://localhost:3000',
};

describe('parseEnv', () => {
  it('converts and normalizes valid environment values', () => {
    const parsed = parseEnv(validEnv);

    expect(parsed.PORT).toBe(4321);
    expect(parsed.APP_URL).toBe('http://localhost:3000');
  });

  it('rejects the public example secret', () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        BETTER_AUTH_SECRET: 'your-secret-key-here-generate-with-openssl-rand-base64-32',
      }),
    ).toThrow('must not use the example placeholder');
  });

  it('requires https for non-local production origins', () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        NODE_ENV: 'production',
        APP_URL: 'http://example.com',
      }),
    ).toThrow('APP_URL must use https in production');
  });

  it('builds the Better Stack logs endpoint from the ingesting host', () => {
    const parsed = parseEnv({
      ...validEnv,
      BETTER_STACK_SOURCE_TOKEN: 'source-token',
      BETTER_STACK_INGESTING_HOST: 's123.eu-nbg-2.betterstackdata.com',
    });

    expect(parsed.BETTER_STACK_LOGS_URL).toBe('https://s123.eu-nbg-2.betterstackdata.com/v1/logs');
  });

  it('requires the Better Stack token and host together', () => {
    expect(() => parseEnv({ ...validEnv, BETTER_STACK_SOURCE_TOKEN: 'source-token' })).toThrow('must be set together');
  });

  it('rejects a plain http Better Stack endpoint', () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        BETTER_STACK_SOURCE_TOKEN: 'source-token',
        BETTER_STACK_INGESTING_HOST: 'http://s123.betterstackdata.com',
      }),
    ).toThrow('must use https');
  });

  it('logs emails locally outside production by default', () => {
    expect(parseEnv(validEnv).EMAIL_TRANSPORT).toBe('console');
  });

  it('requires Resend credentials in production unless another transport is chosen', () => {
    const production = {
      ...validEnv,
      NODE_ENV: 'production',
      APP_URL: 'https://app.example.com',
      BETTER_AUTH_URL: 'https://app.example.com',
    };

    expect(() => parseEnv(production)).toThrow('RESEND_API_KEY and EMAIL_FROM are required');
    expect(
      parseEnv({ ...production, RESEND_API_KEY: 're_key', EMAIL_FROM: 'App <no-reply@example.com>' }).EMAIL_TRANSPORT,
    ).toBe('resend');
    expect(parseEnv({ ...production, EMAIL_TRANSPORT: 'console' }).EMAIL_TRANSPORT).toBe('console');
  });

  it('falls back to the Render public URL for app origins, so a first deploy works before a domain exists', () => {
    const { APP_URL: _app, BETTER_AUTH_URL: _auth, ...withoutOrigins } = validEnv;
    const parsed = parseEnv({
      ...withoutOrigins,
      NODE_ENV: 'production',
      EMAIL_TRANSPORT: 'console',
      RENDER_EXTERNAL_URL: 'https://elysium.onrender.com',
    });

    expect(parsed.APP_URL).toBe('https://elysium.onrender.com');
    expect(parsed.BETTER_AUTH_URL).toBe('https://elysium.onrender.com');
  });

  it('keeps explicit origins over the Render URL, so a custom domain is not overridden', () => {
    const parsed = parseEnv({
      ...validEnv,
      APP_URL: 'http://localhost:3000',
      RENDER_EXTERNAL_URL: 'https://elysium.onrender.com',
    });

    expect(parsed.APP_URL).toBe('http://localhost:3000');
  });

  it('treats empty values as unset, so blank dashboard fields do not fail startup', () => {
    const parsed = parseEnv({
      ...validEnv,
      BETTER_STACK_SOURCE_TOKEN: '',
      BETTER_STACK_INGESTING_HOST: '',
      RESEND_API_KEY: '',
    });

    expect(parsed.BETTER_STACK_LOGS_URL).toBeUndefined();
    expect(parsed.BETTER_STACK_SOURCE_TOKEN).toBeUndefined();
  });
});
