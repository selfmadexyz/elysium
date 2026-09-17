import type { PostResponse } from '@elysium/contracts/posts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@frontend/components/ui/alert-dialog';
import { Spinner } from '@frontend/components/ui/spinner';
import { useDeletePost } from '@frontend/hooks/use-delete-post';

type DeletePostAlertProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostResponse;
};

export function DeletePostAlert({ open, onOpenChange, post }: DeletePostAlertProps) {
  const deletePost = useDeletePost();

  const handleDelete = async () => {
    await deletePost.mutateAsync(post.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the post
            <strong className="mt-2 block text-foreground">&quot;{post.title}&quot;</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePost.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deletePost.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deletePost.isPending ? <Spinner /> : 'Delete Post'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
