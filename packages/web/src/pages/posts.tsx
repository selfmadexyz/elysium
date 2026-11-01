import type { PostResponse } from '@elysium/contracts/posts';
import { CreatePostDialog, DeletePostAlert, EditPostDialog, PostsTable } from '@frontend/components/posts';
import { Button } from '@frontend/components/ui/button';
import { usePosts } from '@frontend/hooks/use-posts';
import { PlusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';

export function Posts() {
  const [page, setPage] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<PostResponse | undefined>(undefined);
  const [postToDelete, setPostToDelete] = useState<PostResponse | undefined>(undefined);

  const { data, isLoading, error } = usePosts(page);
  const posts = data?.posts ?? [];

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Posts</h1>
          <p className="text-muted-foreground">Manage your posts here. Create, edit, or delete posts.</p>
        </div>
        <Button className="self-start sm:self-auto" onClick={handleCreate}>
          <HugeiconsIcon icon={PlusSignIcon} />
          Create Post
        </Button>
      </div>

      <PostsTable posts={posts} onEdit={handleEdit} onDelete={handleDelete} />
      <nav aria-label="Posts pagination" className="flex items-center justify-between gap-4">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
          Previous page
        </Button>
        <span aria-live="polite" className="text-muted-foreground text-sm">
          Page {page + 1}
        </span>
        <Button variant="outline" disabled={!data?.hasNextPage} onClick={() => setPage((value) => value + 1)}>
          Next page
        </Button>
      </nav>
      <CreatePostDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} onCreated={() => setPage(0)} />

      {postToEdit && <EditPostDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} post={postToEdit} />}
      {postToDelete && (
        <DeletePostAlert
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          post={postToDelete}
          onDeleted={() => {
            if (page > 0 && posts.length === 1) setPage((value) => value - 1);
          }}
        />
      )}
    </div>
  );
}
