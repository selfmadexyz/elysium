import { Type } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { Value } from '@sinclair/typebox/value';

const envSchema = Type.Object(
  {
    NODE_ENV: Type.Union([Type.Literal('development'), Type.Literal('test'), Type.Literal('production')], {
      default: 'development',
    }),
    DATABASE_URL: Type.String({ minLength: 1 }),
    PORT: Type.Integer({ minimum: 1, maximum: 65_535, default: 3001 }),
    BETTER_AUTH_SECRET: Type.String({ minLength: 32 }),
    BETTER_AUTH_URL: Type.String({ minLength: 1 }),
    GOOGLE_CLIENT_ID: Type.String({ minLength: 1 }),
    GOOGLE_CLIENT_SECRET: Type.String({ minLength: 1 }),
    APP_URL: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export type Env = typeof envSchema.static;

const compiledEnvSchema = TypeCompiler.Compile(envSchema);
const placeholderSecret = 'your-secret-key-here-generate-with-openssl-rand-base64-32';

const parseHttpUrl = (name: 'APP_URL' | 'BETTER_AUTH_URL', value: string, nodeEnv: Env['NODE_ENV']) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must use http or https`);
  }

  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
  if (nodeEnv === 'production' && url.protocol !== 'https:' && !isLocalhost) {
    throw new Error(`${name} must use https in production`);
  }

  return url.origin;
};

export function parseEnv(source: Record<string, string | undefined>): Env {
  const candidate = Value.Convert(envSchema, Value.Default(envSchema, structuredClone(source)));
  Value.Clean(envSchema, candidate);

  const errors = Array.from(compiledEnvSchema.Errors(candidate));
  if (errors.length > 0) {
    throw new Error(errors.map((error) => `${error.path || '/'} ${error.message}`).join('; '));
  }

  const decoded = compiledEnvSchema.Decode(candidate);
  const databaseUrl = new URL(decoded.DATABASE_URL);
  if (databaseUrl.protocol !== 'postgres:' && databaseUrl.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must use postgres or postgresql');
  }

  if (decoded.BETTER_AUTH_SECRET === placeholderSecret) {
    throw new Error('BETTER_AUTH_SECRET must not use the example placeholder');
  }

  return {
    ...decoded,
    APP_URL: parseHttpUrl('APP_URL', decoded.APP_URL, decoded.NODE_ENV),
    BETTER_AUTH_URL: parseHttpUrl('BETTER_AUTH_URL', decoded.BETTER_AUTH_URL, decoded.NODE_ENV),
  };
}

export const env = (() => {
  try {
    return parseEnv(process.env);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown validation error';
    console.error(`❌ Invalid environment: ${message}`);
    throw error;
  }
})();
