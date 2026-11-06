import { describe, expect, it } from 'bun:test';
import { createLogger, otlpLogProcessor } from '@backend/lib/logger';
import { SeverityNumber } from '@opentelemetry/api';
import { InMemoryLogRecordExporter, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';

const setup = (level: 'debug' | 'info' | 'warn' | 'error' = 'info') => {
  const exporter = new InMemoryLogRecordExporter();
  const logger = createLogger({
    level,
    format: 'none',
    serviceName: 'elysium-test',
    environment: 'test',
    processors: [new SimpleLogRecordProcessor({ exporter })],
  });
  return { exporter, logger };
};

describe('createLogger', () => {
  it('exports records with the service resource and severity', () => {
    const { exporter, logger } = setup();

    logger.info('HTTP request', { 'http.route': '/api/posts' });

    const [record] = exporter.getFinishedLogRecords();
    expect(record?.body).toBe('HTTP request');
    expect(record?.severityNumber).toBe(SeverityNumber.INFO);
    expect(record?.attributes['http.route']).toBe('/api/posts');
    expect(record?.resource.attributes['service.name']).toBe('elysium-test');
  });

  it('drops records below the configured level', () => {
    const { exporter, logger } = setup('warn');

    logger.debug('noise');
    logger.info('noise');
    logger.warn('kept');

    expect(exporter.getFinishedLogRecords().map((record) => record.body)).toEqual(['kept']);
  });

  it('attaches exception attributes to errors', () => {
    const { exporter, logger } = setup();

    logger.error('Request failed', new TypeError('boom'), { 'error.code': 'UNKNOWN' });

    const [record] = exporter.getFinishedLogRecords();
    expect(record?.severityNumber).toBe(SeverityNumber.ERROR);
    expect(record?.attributes['exception.type']).toBe('TypeError');
    expect(record?.attributes['exception.message']).toBe('boom');
    expect(String(record?.attributes['exception.stacktrace'])).toContain('TypeError: boom');
    expect(record?.attributes['error.code']).toBe('UNKNOWN');
  });

  it('exports batched OTLP/HTTP logs with the configured headers, so authenticated backends accept them', async () => {
    const received: { authorization: string | null; contentType: string | null; body: string }[] = [];
    const server = Bun.serve({
      port: 0,
      async fetch(request) {
        received.push({
          authorization: request.headers.get('authorization'),
          contentType: request.headers.get('content-type'),
          body: await request.text(),
        });
        return Response.json({});
      },
    });
    try {
      const logger = createLogger({
        level: 'info',
        format: 'none',
        serviceName: 'elysium-test',
        environment: 'test',
        processors: [
          otlpLogProcessor({
            url: `http://127.0.0.1:${server.port}/v1/logs`,
            headers: { Authorization: 'Bearer source-token' },
          }),
        ],
      });

      logger.error('Export check', new Error('exported failure'));
      await logger.flush();

      expect(received).toHaveLength(1);
      expect(received[0]?.authorization).toBe('Bearer source-token');
      expect(received[0]?.contentType).toContain('application/json');
      expect(received[0]?.body).toContain('Export check');
      expect(received[0]?.body).toContain('exported failure');
      expect(received[0]?.body).toContain('elysium-test');
      await logger.shutdown();
    } finally {
      server.stop(true);
    }
  });
});
