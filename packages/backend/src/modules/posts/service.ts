import { table } from '@backend/database/schema';
import { db } from '@backend/lib/db';
import { InternalServerError, NotFoundError, ServerError } from '@backend/lib/errors';
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

const asInternalError = (message: string, error: unknown): never => {
  if (error instanceof ServerError) throw error;
  throw new InternalServerError(message, error);
};

export function createPostsService(repository: PostsRepository) {
  return {
    async list(authorId: string, pagination: Partial<PostPagination> = {}): Promise<PostResponse[]> {
      try {
        return await repository.listByAuthor(authorId, {
          limit: pagination.limit ?? 20,
          offset: pagination.offset ?? 0,
        });
      } catch (error) {
        return asInternalError('Failed to fetch posts', error);
      }
    },

    async get(id: number, authorId: string): Promise<PostResponse> {
      try {
        const post = await repository.findByIdAndAuthor(id, authorId);
        if (!post) throw new NotFoundError(`Post with id ${id} not found`);
        return post;
      } catch (error) {
        return asInternalError('Failed to fetch post', error);
      }
    },

    async create(authorId: string, request: CreatePostRequest): Promise<PostResponse> {
      try {
        const post = await repository.create(authorId, request);
        if (!post) throw new InternalServerError('Failed to create post');
        return post;
      } catch (error) {
        return asInternalError('Failed to create post', error);
      }
    },

    async update(id: number, authorId: string, request: UpdatePostRequest): Promise<PostResponse> {
      try {
        const post = await repository.update(id, authorId, request);
        if (!post) throw new NotFoundError(`Post with id ${id} not found`);
        return post;
      } catch (error) {
        return asInternalError('Failed to update post', error);
      }
    },

    async delete(id: number, authorId: string): Promise<void> {
      try {
        const deleted = await repository.delete(id, authorId);
        if (!deleted) throw new NotFoundError(`Post with id ${id} not found`);
      } catch (error) {
        return asInternalError('Failed to delete post', error);
      }
    },
  };
}

export const postsService = createPostsService(drizzlePostsRepository);
export type PostsService = ReturnType<typeof createPostsService>;
