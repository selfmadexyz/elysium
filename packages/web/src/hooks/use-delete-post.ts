import { client } from '@frontend/lib/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      const response = await client.api.posts({ id: postId }).delete();

      if (response.error) {
        throw new Error(response.error.value.message);
      }

      if (!response.data?.success) {
        throw new Error('Failed to delete post');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to delete post');
    },
  });
}
