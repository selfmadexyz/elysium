import type { PostResponse } from '@elysium/contracts/posts';
import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@frontend/components/ui/field';
import { Input } from '@frontend/components/ui/input';
import { Spinner } from '@frontend/components/ui/spinner';
import { Textarea } from '@frontend/components/ui/textarea';
import { useUpdatePost } from '@frontend/hooks/use-update-post';
import { postSchema } from '@frontend/lib/validations';
import { useForm } from '@tanstack/react-form';

type EditPostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostResponse;
};

export function EditPostDialog({ open, onOpenChange, post }: EditPostDialogProps) {
  const updatePost = useUpdatePost();

  const form = useForm({
    defaultValues: {
      title: post.title,
      body: post.body,
    },
    validators: {
      onChange: postSchema,
    },
    onSubmit: async ({ value }) => {
      await updatePost.mutateAsync({ id: post.id, ...value });
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        form.reset();
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-[525px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>Make changes to your post here.</DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <form.Field name="title">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Enter post title"
                      disabled={updatePost.isPending}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="body">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Body</FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Enter post content"
                      rows={5}
                      disabled={updatePost.isPending}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              disabled={updatePost.isPending}
              render={
                <Button type="button" variant="outline" disabled={updatePost.isPending}>
                  Cancel
                </Button>
              }
            />
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || updatePost.isPending}>
                  {updatePost.isPending || isSubmitting ? <Spinner /> : 'Update Post'}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
