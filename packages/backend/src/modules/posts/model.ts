import { CreatePostRequestSchema, PostResponseSchema, UpdatePostRequestSchema } from '@elysium/contracts/posts';
import { Elysia, t } from 'elysia';

export const listPostsQuery = t.Object({
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, multipleOf: 1 })),
  offset: t.Optional(t.Numeric({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER, multipleOf: 1 })),
});

export const PostModel = new Elysia({ name: 'Post.Model' }).model({
  post: PostResponseSchema,
  'post.create': CreatePostRequestSchema,
  'post.update': UpdatePostRequestSchema,
});

export type ListPostsQuery = typeof listPostsQuery.static;
