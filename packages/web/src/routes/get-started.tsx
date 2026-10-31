import GetStarted from '@frontend/pages/get-started';
import { createFileRoute } from '@tanstack/react-router';

const title = 'Get started with Elysium';
const description = 'Install, configure, and run the Elysium Bun full-stack starter.';

export const Route = createFileRoute('/get-started')({
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
    ],
  }),
  component: GetStarted,
});
