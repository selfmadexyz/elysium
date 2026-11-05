import { Field, FieldError, FieldLabel } from '@frontend/components/ui/field';
import { Input } from '@frontend/components/ui/input';
import type { AnyFieldApi } from '@tanstack/react-form';

export function TextField({
  field,
  label,
  ...inputProps
}: Readonly<
  { field: AnyFieldApi; label: string } & Omit<React.ComponentProps<typeof Input>, 'id' | 'name' | 'value'>
>) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={isInvalid}
        required
        {...inputProps}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
