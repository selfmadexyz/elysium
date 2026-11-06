import { env } from '@backend/env';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
} from '@backend/lib/errors';
import { logger } from '@backend/lib/logger';
import { routes } from '@backend/routes';
import cors from '@elysiajs/cors';
import { Elysia } from 'elysia';

const documentation = new Elysia({ name: 'documentation' });

if (env.NODE_ENV !== 'production') {
  const { openapi } = await import('@elysiajs/openapi');

  documentation.use(
    openapi({
      path: '/api/swagger',
      specPath: '/api/swagger/json',
      documentation: {
        info: {
          title: 'Starter API',
          version: '1.0.0',
          description: 'Modern full-stack starter with Elysia, React, and Drizzle',
        },
        tags: [
          { name: 'Health', description: 'Health check endpoints' },
          { name: 'Posts', description: 'Posts CRUD operations' },
          { name: 'Auth', description: 'Authentication endpoints' },
        ],
      },
    }),
  );
}

const requestStartedAt = new WeakMap<Request, number>();

const responseStatus = (response: unknown, fallback: number | string | undefined) => {
  if (response instanceof Response) return response.status;
  return typeof fallback === 'number' ? fallback : 200;
};

export function createApp() {
  return new Elysia({
    serve: {
      maxRequestBodySize: 1024 * 1024,
      idleTimeout: 30,
    },
  })
    .onRequest(({ request, set }) => {
      requestStartedAt.set(request, performance.now());
      set.headers['Cache-Control'] = 'no-store';
    })
    .onAfterResponse(({ request, route, set, responseValue }) => {
      if (route === '/api/health') return;
      const startedAt = requestStartedAt.get(request);
      const status = responseStatus(responseValue, set.status);
      logger[status >= 500 ? 'warn' : 'info']('HTTP request', {
        'http.request.method': request.method,
        'http.route': route,
        'http.response.status_code': status,
        ...(startedAt !== undefined && { 'http.server.duration_ms': Math.round(performance.now() - startedAt) }),
      });
    })
    .error({
      ServerError,
      BadRequestError,
      UnauthorizedError,
      ForbiddenError,
      NotFoundError,
      ConflictError,
      InternalServerError,
    })
    .onError(({ code, error, set, request, route }) => {
      const errorName = error instanceof Error ? error.name : String(code);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isClientError =
        code === 'VALIDATION' ||
        code === 'PARSE' ||
        code === 'NOT_FOUND' ||
        (error instanceof ServerError && error.status < 500);

      if (!isClientError) {
        logger.error(`${errorName}: ${errorMessage}`, error, {
          'error.code': String(code),
          'http.request.method': request.method,
          'http.route': route,
        });
      }

      if (error instanceof ServerError) {
        set.status = error.status;
        if (env.NODE_ENV === 'production' && error.status >= 500) {
          return {
            error: 'Internal Server Error',
            message: 'Something went wrong',
          };
        }
        return {
          error: error.name,
          message: error.message,
        };
      }

      if (code === 'VALIDATION') {
        set.status = 400;
        return {
          error: 'Validation Error',
          message: error.message || 'Invalid request data',
          ...(env.NODE_ENV !== 'production' && {
            details: error.all,
          }),
        };
      }

      if (code === 'NOT_FOUND') {
        set.status = 404;
        return {
          error: 'Not Found',
          message: 'Route not found',
        };
      }

      if (code === 'PARSE') {
        set.status = 400;
        return {
          error: 'Parse Error',
          message: 'Invalid request format',
        };
      }

      set.status = 500;
      return {
        error: 'Internal Server Error',
        message: env.NODE_ENV === 'production' ? 'Something went wrong' : errorMessage,
      };
    })
    .use(
      cors({
        origin: env.APP_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }),
    )
    .use(documentation)
    .use(routes);
}

export const app = createApp();
export type App = typeof app;
