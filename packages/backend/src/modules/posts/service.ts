import { table } from '@backend/database/schema';
import { db } from '@backend/lib/db';
import { InternalServerError, NotFoundError } from '@backend/lib/errors';
import type { ListPostsQuery } from '@backend/modules/posts/model';
import type { CreatePostRequest, PostResponse, UpdatePostRequest } from '@elysium/contracts/posts';
import { and, eq } from 'drizzle-orm';

export const postsService = {
  async list(authorId: string, pagination: ListPostsQuery = {}): Promise<PostResponse[]> {
    return db
      .select()
      .from(table.postsTable)
      .where(eq(table.postsTable.authorId, authorId))
      .limit(pagination.limit ?? 20)
      .offset(pagination.offset ?? 0);
  },

  async get(id: number, authorId: string): Promise<PostResponse> {
    const [post] = await db
      .select()
      .from(table.postsTable)
      .where(and(eq(table.postsTable.id, id), eq(table.postsTable.authorId, authorId)))
      .limit(1);
    if (!post) throw new NotFoundError(`Post with id ${id} not found`);
    return post;
  },

  async create(authorId: string, request: CreatePostRequest): Promise<PostResponse> {
    const [post] = await db
      .insert(table.postsTable)
      .values({ ...request, authorId })
      .returning();
    if (!post) throw new InternalServerError('Failed to create post');
    return post;
  },

  async update(id: number, authorId: string, request: UpdatePostRequest): Promise<PostResponse> {
    const [post] = await db
      .update(table.postsTable)
      .set(request)
      .where(and(eq(table.postsTable.id, id), eq(table.postsTable.authorId, authorId)))
      .returning();
    if (!post) throw new NotFoundError(`Post with id ${id} not found`);
    return post;
  },

  async delete(id: number, authorId: string): Promise<void> {
    const [post] = await db
      .delete(table.postsTable)
      .where(and(eq(table.postsTable.id, id), eq(table.postsTable.authorId, authorId)))
      .returning({ id: table.postsTable.id });
    if (!post) throw new NotFoundError(`Post with id ${id} not found`);
  },
};
