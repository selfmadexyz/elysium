import { type Env, env } from '@backend/env';
import { type Attributes, type Logger as OtelLogger, SeverityNumber } from '@opentelemetry/api';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider, type LogRecordProcessor } from '@opentelemetry/sdk-logs';

export type LogLevel = Env['LOG_LEVEL'];

const levels: Record<LogLevel, { rank: number; severity: SeverityNumber }> = {
  debug: { rank: 0, severity: SeverityNumber.DEBUG },
  info: { rank: 1, severity: SeverityNumber.INFO },
  warn: { rank: 2, severity: SeverityNumber.WARN },
  error: { rank: 3, severity: SeverityNumber.ERROR },
};

const describeCause = (cause: unknown) => (cause instanceof Error ? (cause.stack ?? cause.message) : String(cause));

export function errorAttributes(error: unknown): Attributes {
  if (error instanceof Error) {
    return {
      'exception.type': error.name,
      'exception.message': error.message,
      ...(error.stack && { 'exception.stacktrace': error.stack }),
      ...(error.cause !== undefined && { 'exception.cause': describeCause(error.cause) }),
    };
  }
  return { 'exception.message': String(error) };
}

type ConsoleFormat = 'json' | 'pretty' | 'none';

export type LoggerOptions = {
  level: LogLevel;
  format: ConsoleFormat;
  serviceName: string;
  environment: string;
  processors: LogRecordProcessor[];
};

export function createLogger({ level, format, serviceName, environment, processors }: LoggerOptions) {
  const provider =
    processors.length > 0
      ? new LoggerProvider({
          resource: resourceFromAttributes({
            'service.name': serviceName,
            'deployment.environment.name': environment,
          }),
          processors,
        })
      : undefined;
  const otel: OtelLogger | undefined = provider?.getLogger(serviceName);
  const minimum = levels[level].rank;

  const write = (logLevel: LogLevel, message: string, attributes: Attributes) => {
    if (levels[logLevel].rank < minimum) return;

    otel?.emit({
      severityNumber: levels[logLevel].severity,
      severityText: logLevel.toUpperCase(),
      body: message,
      attributes,
    });

    if (format === 'none') return;
    const stream = logLevel === 'error' || logLevel === 'warn' ? console.error : console.log;
    if (format === 'json') {
      stream(JSON.stringify({ time: new Date().toISOString(), level: logLevel, message, ...attributes }));
    } else {
      const details = Object.keys(attributes).length > 0 ? attributes : '';
      stream(`[${logLevel}] ${message}`, details);
    }
  };

  return {
    debug: (message: string, attributes: Attributes = {}) => write('debug', message, attributes),
    info: (message: string, attributes: Attributes = {}) => write('info', message, attributes),
    warn: (message: string, attributes: Attributes = {}) => write('warn', message, attributes),
    error: (message: string, error?: unknown, attributes: Attributes = {}) =>
      write('error', message, { ...(error !== undefined && errorAttributes(error)), ...attributes }),
    flush: async () => {
      await provider?.forceFlush();
    },
    shutdown: async () => {
      await provider?.shutdown();
    },
  };
}

export type AppLogger = ReturnType<typeof createLogger>;

export function betterStackProcessor(url: string, sourceToken: string) {
  return new BatchLogRecordProcessor({
    exporter: new OTLPLogExporter({ url, headers: { Authorization: `Bearer ${sourceToken}` } }),
  });
}

function betterStackProcessors(): LogRecordProcessor[] {
  if (!env.BETTER_STACK_LOGS_URL || !env.BETTER_STACK_SOURCE_TOKEN || env.NODE_ENV === 'test') return [];
  return [betterStackProcessor(env.BETTER_STACK_LOGS_URL, env.BETTER_STACK_SOURCE_TOKEN)];
}

export const logger = createLogger({
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === 'production' ? 'json' : 'pretty',
  serviceName: env.OTEL_SERVICE_NAME,
  environment: env.NODE_ENV,
  processors: betterStackProcessors(),
});

process.on('uncaughtExceptionMonitor', (error, origin) => {
  logger.error('Uncaught exception', error, { 'exception.origin': origin });
});
process.once('beforeExit', () => {
  void logger.shutdown();
});
