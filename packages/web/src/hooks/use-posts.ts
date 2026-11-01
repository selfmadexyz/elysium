import { client } from '@frontend/lib/client';
import { queryOptions, useQuery } from '@tanstack/react-query';

export const POSTS_PAGE_SIZE = 20;

export function usePosts(page = 0) {
  return useQuery(postsQueryOptions(page));
}

const fetchPosts = async (page: number) => {
  const response = await client.api.posts.get({
    query: { limit: POSTS_PAGE_SIZE + 1, offset: page * POSTS_PAGE_SIZE },
  });

  if (response.error) {
    throw new Error(response.error.value.message);
  }

  if (!response.data) {
    throw new Error('Failed to fetch posts');
  }

  return {
    posts: response.data.slice(0, POSTS_PAGE_SIZE),
    hasNextPage: response.data.length > POSTS_PAGE_SIZE,
  };
};

export const postsQueryOptions = (page = 0) =>
  queryOptions({
    queryKey: ['posts', { page, pageSize: POSTS_PAGE_SIZE }],
    queryFn: () => fetchPosts(page),
  });
