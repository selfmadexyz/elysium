import type { PostResponse } from '@elysium/contracts/posts';
import { CreatePostDialog, DeletePostAlert, EditPostDialog, PostsTable } from '@frontend/components/posts';
import { Button } from '@frontend/components/ui/button';
import { usePosts } from '@frontend/hooks/use-posts';
import { PlusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';

export function Posts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<PostResponse | undefined>(undefined);
  const [postToDelete, setPostToDelete] = useState<PostResponse | undefined>(undefined);

  const { data: posts = [], isLoading, error } = usePosts();

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (post: PostResponse) => {
    setPostToEdit(post);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (post: PostResponse) => {
    setPostToDelete(post);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-destructive">Error loading posts: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Posts</h1>
          <p className="text-muted-foreground">Manage your posts here. Create, edit, or delete posts.</p>
        </div>
        <Button onClick={handleCreate}>
          <HugeiconsIcon icon={PlusSignIcon} />
          Create Post
        </Button>
      </div>

      <PostsTable posts={posts ?? []} onEdit={handleEdit} onDelete={handleDelete} />
      <CreatePostDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      {postToEdit && <EditPostDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} post={postToEdit} />}
      {postToDelete && (
        <DeletePostAlert open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} post={postToDelete} />
      )}
    </div>
  );
}
