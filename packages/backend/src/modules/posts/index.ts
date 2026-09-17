import { CommonModel } from '@backend/lib/models';
import { authMiddleware } from '@backend/modules/auth/middleware';
import { listPostsQuery, PostModel } from '@backend/modules/posts/model';
import { postsService } from '@backend/modules/posts/service';
import { Elysia, t } from 'elysia';

export const posts = new Elysia({
  name: 'posts',
  prefix: '/posts',
  tags: ['Posts'],
})
  .use(authMiddleware)
  .use(CommonModel)
  .use(PostModel)
  .get(
    '/',
    async ({ query, user }) => {
      return await postsService.list(user.id, query);
    },
    {
      auth: true,
      query: listPostsQuery,
      detail: {
        description: 'Get all posts',
        summary: 'List all posts',
      },
      response: {
        200: t.Array(t.Ref('post')),
        401: 'error',
        500: 'error',
      },
    },
  )
  .get(
    '/:id',
    async ({ params, user }) => {
      return await postsService.get(params.id, user.id);
    },
    {
      auth: true,
      params: t.Object({
        id: t.Numeric({
          error: 'Invalid post ID',
        }),
      }),
      detail: {
        description: 'Get a post by ID',
      },
      response: {
        200: t.Ref('post'),
        400: 'error',
        401: 'error',
        404: 'error',
        500: 'error',
      },
    },
  )
  .post(
    '/',
    async ({ body, user }) => {
      return await postsService.create(user.id, body);
    },
    {
      auth: true,
      body: 'post.create',
      detail: {
        description: 'Create a new post (requires authentication)',
      },
      response: {
        200: 'post',
        400: 'error',
        401: 'error',
        500: 'error',
      },
    },
  )
  .put(
    '/:id',
    async ({ params, body, user }) => {
      return await postsService.update(params.id, user.id, body);
    },
    {
      auth: true,
      params: t.Object({
        id: t.Numeric({
          error: 'Invalid post ID',
        }),
      }),
      body: 'post.update',
      detail: {
        description: 'Update an existing post (requires authentication)',
      },
      response: {
        200: t.Ref('post'),
        400: 'error',
        401: 'error',
        404: 'error',
        500: 'error',
      },
    },
  )
  .delete(
    '/:id',
    async ({ params, user }) => {
      await postsService.delete(params.id, user.id);
      return { success: true };
    },
    {
      auth: true,
      params: t.Object({
        id: t.Numeric({
          error: 'Invalid post ID',
        }),
      }),
      detail: {
        description: 'Delete a post (requires authentication)',
      },
      response: {
        200: t.Object({
          success: t.Boolean(),
        }),
        400: 'error',
        401: 'error',
        404: 'error',
        500: 'error',
      },
    },
  );
