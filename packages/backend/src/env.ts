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
    LOG_LEVEL: Type.Union([Type.Literal('debug'), Type.Literal('info'), Type.Literal('warn'), Type.Literal('error')], {
      default: 'info',
    }),
    OTEL_SERVICE_NAME: Type.String({ minLength: 1, default: 'elysium' }),
    EMAIL_TRANSPORT: Type.Optional(Type.Union([Type.Literal('smtp'), Type.Literal('console')])),
    EMAIL_FROM: Type.Optional(Type.String({ minLength: 3 })),
    SMTP_URL: Type.Optional(Type.String({ minLength: 1 })),
    OTEL_EXPORTER_OTLP_ENDPOINT: Type.Optional(Type.String({ minLength: 1 })),
    OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: Type.Optional(Type.String({ minLength: 1 })),
    OTEL_EXPORTER_OTLP_HEADERS: Type.Optional(Type.String({ minLength: 1 })),
    OTEL_EXPORTER_OTLP_LOGS_HEADERS: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

type ParsedEnv = typeof envSchema.static;

export type Env = Omit<ParsedEnv, 'EMAIL_TRANSPORT'> & {
  EMAIL_TRANSPORT: NonNullable<ParsedEnv['EMAIL_TRANSPORT']>;
  OTLP_LOGS?: { url: string; headers: Record<string, string> };
};

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

const parseOtlpLogs = (decoded: ParsedEnv): Env['OTLP_LOGS'] => {
  const name = decoded.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT
    ? 'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT'
    : 'OTEL_EXPORTER_OTLP_ENDPOINT';
  const endpoint = decoded[name];
  if (!endpoint) return undefined;

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must use http or https`);
  }
  if (name === 'OTEL_EXPORTER_OTLP_ENDPOINT') {
    url.pathname = `${url.pathname.replace(/\/$/, '')}/v1/logs`;
  }

  const headers: Record<string, string> = {};
  for (const pair of (decoded.OTEL_EXPORTER_OTLP_LOGS_HEADERS ?? decoded.OTEL_EXPORTER_OTLP_HEADERS ?? '').split(',')) {
    if (!pair.trim()) continue;
    const separator = pair.indexOf('=');
    if (separator < 1) {
      throw new Error('OTLP headers must be comma-separated key=value pairs');
    }
    headers[decodeURIComponent(pair.slice(0, separator).trim())] = decodeURIComponent(pair.slice(separator + 1).trim());
  }

  return { url: url.toString(), headers };
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

  const otlpLogs = parseOtlpLogs(decoded);

  const appUrl = parseHttpUrl('APP_URL', decoded.APP_URL, decoded.NODE_ENV);
  const betterAuthUrl = parseHttpUrl('BETTER_AUTH_URL', decoded.BETTER_AUTH_URL, decoded.NODE_ENV);

  const emailTransport = decoded.EMAIL_TRANSPORT ?? (decoded.NODE_ENV === 'production' ? 'smtp' : 'console');
  if (emailTransport === 'smtp' && (!decoded.SMTP_URL || !decoded.EMAIL_FROM)) {
    throw new Error('SMTP_URL and EMAIL_FROM are required when EMAIL_TRANSPORT is smtp');
  }
  if (decoded.SMTP_URL && !/^smtps?:$/.test(new URL(decoded.SMTP_URL, 'invalid:/').protocol)) {
    throw new Error('SMTP_URL must use smtp:// or smtps://');
  }

  return {
    ...decoded,
    EMAIL_TRANSPORT: emailTransport,
    ...(otlpLogs && { OTLP_LOGS: otlpLogs }),
    APP_URL: appUrl,
    BETTER_AUTH_URL: betterAuthUrl,
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
