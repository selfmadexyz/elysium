import { describe, expect, it } from 'bun:test';
import { InternalServerError, NotFoundError } from '@backend/lib/errors';
import { createPostsService, type PostPagination, type PostsRepository } from '@backend/modules/posts/service';

const alicePost = {
  id: 1,
  title: 'Alice post',
  body: 'Private to Alice',
  authorId: 'alice',
};

const createRepository = (overrides: Partial<PostsRepository> = {}): PostsRepository => ({
  listByAuthor: async () => [],
  findByIdAndAuthor: async () => undefined,
  create: async () => undefined,
  update: async () => undefined,
  delete: async () => false,
  ...overrides,
});

describe('posts ownership', () => {
  it('scopes reads to the authenticated author and applies bounded defaults', async () => {
    let receivedAuthor = '';
    let receivedPagination: PostPagination | undefined;
    const service = createPostsService(
      createRepository({
        listByAuthor: async (authorId, pagination) => {
          receivedAuthor = authorId;
          receivedPagination = pagination;
          return [alicePost];
        },
      }),
    );

    expect(await service.list('alice')).toEqual([alicePost]);
    expect(receivedAuthor).toBe('alice');
    expect(receivedPagination).toEqual({ limit: 20, offset: 0 });
  });

  it('passes the authenticated author to creates', async () => {
    let receivedAuthor = '';
    const service = createPostsService(
      createRepository({
        create: async (authorId, request) => {
          receivedAuthor = authorId;
          return { id: 1, authorId, ...request };
        },
      }),
    );

    expect(await service.create('alice', { title: 'Owned', body: 'By Alice' })).toMatchObject({ authorId: 'alice' });
    expect(receivedAuthor).toBe('alice');
  });

  it('returns not found instead of exposing another user post', async () => {
    const service = createPostsService(
      createRepository({
        findByIdAndAuthor: async (_id, authorId) => (authorId === 'alice' ? alicePost : undefined),
        update: async (_id, authorId) => (authorId === 'alice' ? alicePost : undefined),
        delete: async (_id, authorId) => authorId === 'alice',
      }),
    );

    await expect(service.get(1, 'bob')).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.update(1, 'bob', { title: 'Stolen' })).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.delete(1, 'bob')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('redacts unexpected repository failures behind an internal error', async () => {
    const service = createPostsService(
      createRepository({
        listByAuthor: async () => {
          throw new Error('database detail');
        },
      }),
    );

    await expect(service.list('alice')).rejects.toBeInstanceOf(InternalServerError);
  });
});
