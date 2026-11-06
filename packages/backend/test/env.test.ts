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

  it('appends /v1/logs to the generic OTLP endpoint, so collectors receive logs on the spec path', () => {
    const parsed = parseEnv({ ...validEnv, OTEL_EXPORTER_OTLP_ENDPOINT: 'https://collector.example.com:4318/' });

    expect(parsed.OTLP_LOGS?.url).toBe('https://collector.example.com:4318/v1/logs');
  });

  it('uses the logs-specific endpoint as is and before the generic one, as the OTLP spec requires', () => {
    const parsed = parseEnv({
      ...validEnv,
      OTEL_EXPORTER_OTLP_ENDPOINT: 'https://generic.example.com',
      OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: 'https://logs.example.com/ingest',
    });

    expect(parsed.OTLP_LOGS?.url).toBe('https://logs.example.com/ingest');
  });

  it('decodes OTLP headers, so URL-encoded bearer tokens reach the backend intact', () => {
    const parsed = parseEnv({
      ...validEnv,
      OTEL_EXPORTER_OTLP_ENDPOINT: 'https://collector.example.com',
      OTEL_EXPORTER_OTLP_HEADERS: 'Authorization=Bearer%20secret-token, x-team = core',
    });

    expect(parsed.OTLP_LOGS?.headers).toEqual({ Authorization: 'Bearer secret-token', 'x-team': 'core' });
  });

  it('leaves log export off without an endpoint, so local runs never ship logs', () => {
    expect(parseEnv({ ...validEnv, OTEL_EXPORTER_OTLP_HEADERS: 'Authorization=Bearer%20x' }).OTLP_LOGS).toBeUndefined();
  });

  it('rejects malformed OTLP settings at startup, so a typo does not silently drop logs', () => {
    expect(() => parseEnv({ ...validEnv, OTEL_EXPORTER_OTLP_ENDPOINT: 'collector:4318' })).toThrow(
      'OTEL_EXPORTER_OTLP_ENDPOINT must use http or https',
    );
    expect(() =>
      parseEnv({
        ...validEnv,
        OTEL_EXPORTER_OTLP_ENDPOINT: 'https://c.example.com',
        OTEL_EXPORTER_OTLP_HEADERS: 'token',
      }),
    ).toThrow('OTLP headers must be comma-separated key=value pairs');
  });

  it('logs emails locally outside production by default', () => {
    expect(parseEnv(validEnv).EMAIL_TRANSPORT).toBe('console');
  });

  it('requires SMTP settings in production unless console is chosen, so verification emails are not silently dropped', () => {
    const production = {
      ...validEnv,
      NODE_ENV: 'production',
      APP_URL: 'https://app.example.com',
      BETTER_AUTH_URL: 'https://app.example.com',
    };

    expect(() => parseEnv(production)).toThrow('SMTP_URL and EMAIL_FROM are required');
    expect(
      parseEnv({ ...production, SMTP_URL: 'smtps://user:pass@smtp.example.com:465', EMAIL_FROM: 'App <a@example.com>' })
        .EMAIL_TRANSPORT,
    ).toBe('smtp');
    expect(parseEnv({ ...production, EMAIL_TRANSPORT: 'console' }).EMAIL_TRANSPORT).toBe('console');
  });

  it('rejects a non-SMTP URL, so an HTTP API key pasted by mistake fails at startup', () => {
    expect(() => parseEnv({ ...validEnv, SMTP_URL: 'https://api.example.com' })).toThrow(
      'SMTP_URL must use smtp:// or smtps://',
    );
    expect(parseEnv({ ...validEnv, SMTP_URL: 'smtp://user:pass@localhost:1025' }).SMTP_URL).toBe(
      'smtp://user:pass@localhost:1025',
    );
  });
});
