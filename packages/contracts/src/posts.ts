import { type Static, Type } from '@sinclair/typebox';

export const CreatePostRequestSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 255 }),
  body: Type.String({ minLength: 1, maxLength: 20_000 }),
});

export const UpdatePostRequestSchema = Type.Partial(CreatePostRequestSchema, { minProperties: 1 });

export const PostResponseSchema = Type.Object({
  id: Type.Integer(),
  title: Type.String(),
  body: Type.String(),
  authorId: Type.String(),
});

export type CreatePostRequest = Static<typeof CreatePostRequestSchema>;
export type UpdatePostRequest = Static<typeof UpdatePostRequestSchema>;
export type PostResponse = Static<typeof PostResponseSchema>;
