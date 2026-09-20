import { postsQueryOptions } from '@frontend/hooks/use-posts';
import { Posts } from '@frontend/pages/posts';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/posts')({
  head: () => ({ meta: [{ title: 'Posts' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQueryOptions),
  component: Posts,
});
