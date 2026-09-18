import { afterEach, describe, expect, it } from 'bun:test';
import { table } from '@backend/database/schema';
import { db } from '@backend/lib/db';
import { NotFoundError, ServerError } from '@backend/lib/errors';
import { postsService } from '@backend/modules/posts/service';
import { inArray } from 'drizzle-orm';

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === '1';
const describeDatabase = runDatabaseTests ? describe : describe.skip;
const testId = crypto.randomUUID();
const aliceId = `posts-test-alice-${testId}`;
const bobId = `posts-test-bob-${testId}`;
const userIds = [aliceId, bobId];

async function seedUsers() {
  await db.insert(table.user).values([
    { id: aliceId, name: 'Alice', email: `${aliceId}@example.com` },
    { id: bobId, name: 'Bob', email: `${bobId}@example.com` },
  ]);
}

describeDatabase('posts service PostgreSQL integration', () => {
  afterEach(async () => {
    await db.delete(table.user).where(inArray(table.user.id, userIds));
  });

  it('assigns the authenticated author and lists only their posts', async () => {
    await seedUsers();
    const alicePost = await postsService.create(aliceId, { title: 'Alice post', body: 'Alice body' });
    await postsService.create(bobId, { title: 'Bob post', body: 'Bob body' });

    expect(alicePost).toMatchObject({ authorId: aliceId, title: 'Alice post', body: 'Alice body' });
    expect(await postsService.list(aliceId)).toEqual([alicePost]);
    expect(await postsService.list(aliceId, { limit: 1, offset: 1 })).toEqual([]);
  });

  it("does not expose or mutate another author's post", async () => {
    await seedUsers();
    const bobPost = await postsService.create(bobId, { title: 'Bob post', body: 'Bob body' });

    await expect(postsService.get(bobPost.id, aliceId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(postsService.update(bobPost.id, aliceId, { title: 'Stolen' })).rejects.toBeInstanceOf(NotFoundError);
    await expect(postsService.delete(bobPost.id, aliceId)).rejects.toBeInstanceOf(NotFoundError);
    expect(await postsService.get(bobPost.id, bobId)).toEqual(bobPost);

    expect(await postsService.update(bobPost.id, bobId, { title: 'Bob updated' })).toMatchObject({
      id: bobPost.id,
      authorId: bobId,
      title: 'Bob updated',
    });
    await postsService.delete(bobPost.id, bobId);
    await expect(postsService.get(bobPost.id, bobId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('propagates unexpected database errors without wrapping them', async () => {
    await seedUsers();
    const error = await postsService
      .create(aliceId, { title: 'x'.repeat(256), body: 'Too long for the database column' })
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ServerError);
  });
});
