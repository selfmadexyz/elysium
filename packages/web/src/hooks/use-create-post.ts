import type { CreatePostRequest } from '@elysium/contracts/posts';
import { client } from '@frontend/lib/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreatePostRequest) => {
      const response = await client.api.posts.post(request);

      if (response.error) {
        throw new Error(response.error.value.message);
      }

      if (!response.data) {
        throw new Error('Failed to create post');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post created successfully!');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to create post');
    },
  });
}
