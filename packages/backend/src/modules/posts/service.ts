import { table } from '@backend/database/schema';
import { db } from '@backend/lib/db';
import { InternalServerError, NotFoundError } from '@backend/lib/errors';
import type { ListPostsQuery } from '@backend/modules/posts/model';
import type { CreatePostRequest, PostResponse, UpdatePostRequest } from '@elysium/contracts/posts';
import { and, eq } from 'drizzle-orm';

export type PostPagination = Required<ListPostsQuery>;

export interface PostsRepository {
  listByAuthor(authorId: string, pagination: PostPagination): Promise<PostResponse[]>;
  findByIdAndAuthor(id: number, authorId: string): Promise<PostResponse | undefined>;
  create(authorId: string, request: CreatePostRequest): Promise<PostResponse | undefined>;
  update(id: number, authorId: string, request: UpdatePostRequest): Promise<PostResponse | undefined>;
  delete(id: number, authorId: string): Promise<boolean>;
}

export const drizzlePostsRepository: PostsRepository = {
  async listByAuthor(authorId, { limit, offset }) {
    return db
      .select()
      .from(table.postsTable)
      .where(eq(table.postsTable.authorId, authorId))
      .limit(limit)
      .offset(offset);
  },

  async findByIdAndAuthor(id, authorId) {
    const [post] = await db
      .select()
      .from(table.postsTable)
      .where(and(eq(table.postsTable.id, id), eq(table.postsTable.authorId, authorId)))
      .limit(1);
    return post;
  },

  async create(authorId, request) {
    const [post] = await db
      .insert(table.postsTable)
      .values({ ...request, authorId })
      .returning();
    return post;
  },

  async update(id, authorId, request) {
    const [post] = await db
      .update(table.postsTable)
      .set(request)
      .where(and(eq(table.postsTable.id, id), eq(table.postsTable.authorId, authorId)))
      .returning();
    return post;
  },

  async delete(id, authorId) {
    const [post] = await db
      .delete(table.postsTable)
      .where(and(eq(table.postsTable.id, id), eq(table.postsTable.authorId, authorId)))
      .returning({ id: table.postsTable.id });
    return post !== undefined;
  },
};

export function createPostsService(repository: PostsRepository) {
  return {
    async list(authorId: string, pagination: Partial<PostPagination> = {}): Promise<PostResponse[]> {
      return repository.listByAuthor(authorId, {
        limit: pagination.limit ?? 20,
        offset: pagination.offset ?? 0,
      });
    },

    async get(id: number, authorId: string): Promise<PostResponse> {
      const post = await repository.findByIdAndAuthor(id, authorId);
      if (!post) throw new NotFoundError(`Post with id ${id} not found`);
      return post;
    },

    async create(authorId: string, request: CreatePostRequest): Promise<PostResponse> {
      const post = await repository.create(authorId, request);
      if (!post) throw new InternalServerError('Failed to create post');
      return post;
    },

    async update(id: number, authorId: string, request: UpdatePostRequest): Promise<PostResponse> {
      const post = await repository.update(id, authorId, request);
      if (!post) throw new NotFoundError(`Post with id ${id} not found`);
      return post;
    },

    async delete(id: number, authorId: string): Promise<void> {
      const deleted = await repository.delete(id, authorId);
      if (!deleted) throw new NotFoundError(`Post with id ${id} not found`);
    },
  };
}

export const postsService = createPostsService(drizzlePostsRepository);
export type PostsService = ReturnType<typeof createPostsService>;
