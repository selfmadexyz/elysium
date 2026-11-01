import type { PostResponse } from '@elysium/contracts/posts';
import { Button } from '@frontend/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@frontend/components/ui/table';
import { Delete01Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

type PostsTableProps = {
  posts: PostResponse[];
  onEdit: (post: PostResponse) => void;
  onDelete: (post: PostResponse) => void;
};

export function PostsTable({ posts, onEdit, onDelete }: PostsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Body</TableHead>
            <TableHead className="w-[150px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No posts found.
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.id}</TableCell>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell className="max-w-md truncate">{post.body}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(post)} aria-label="Edit post">
                      <HugeiconsIcon icon={PencilEdit01Icon} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(post)} aria-label="Delete post">
                      <HugeiconsIcon icon={Delete01Icon} className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
