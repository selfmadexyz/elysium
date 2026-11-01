import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
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
import { useCreatePost } from '@frontend/hooks/use-create-post';
import { postSchema } from '@frontend/lib/validations';
import { useForm } from '@tanstack/react-form';

type CreatePostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function CreatePostDialog({ open, onOpenChange, onCreated }: CreatePostDialogProps) {
  const createPost = useCreatePost();

  const form = useForm({
    defaultValues: {
      title: '',
      body: '',
    },
    validators: {
      onChange: postSchema,
    },
    onSubmit: async ({ value }) => {
      await createPost.mutateAsync(value);
      onCreated?.();
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>Add a new post to your collection.</DialogDescription>
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
                      disabled={createPost.isPending}
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
                      disabled={createPost.isPending}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createPost.isPending}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || createPost.isPending}>
                  {createPost.isPending || isSubmitting ? <Spinner /> : 'Create Post'}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
