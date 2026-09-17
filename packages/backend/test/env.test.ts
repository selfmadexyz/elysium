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
});
