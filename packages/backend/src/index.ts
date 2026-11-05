import { app } from '@backend/app';
import { env } from '@backend/env';
import { logger } from '@backend/lib/logger';

export type { App } from '@backend/app';
export { app } from '@backend/app';

if (import.meta.main) {
  app.listen(env.PORT);
  logger.info(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
}
