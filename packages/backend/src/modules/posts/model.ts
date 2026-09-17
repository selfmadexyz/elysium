import { table } from '@backend/database/schema';
import { createSelectSchema } from 'drizzle-typebox';
import { Elysia, t } from 'elysia';

const selectPostSchema = createSelectSchema(table.postsTable);

export const createPostRequest = t.Object({
  title: t.String({ minLength: 1, maxLength: 255 }),
  body: t.String({ minLength: 1, maxLength: 20_000 }),
});
export const updatePostRequest = t.Partial(createPostRequest, { minProperties: 1 });
export const postResponse = selectPostSchema;
export const listPostsQuery = t.Object({
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  offset: t.Optional(t.Numeric({ minimum: 0, maximum: 10_000 })),
});

export const PostModel = new Elysia({ name: 'Post.Model' }).model({
  post: postResponse,
  'post.create': createPostRequest,
  'post.update': updatePostRequest,
});

export type CreatePostRequest = typeof createPostRequest.static;
export type UpdatePostRequest = typeof updatePostRequest.static;
export type PostResponse = typeof postResponse.static;
export type ListPostsQuery = typeof listPostsQuery.static;
