import { useId, type ComponentProps, type ReactNode } from 'react';

export type TextareaFieldProps = ComponentProps<'textarea'> & {
  label: ReactNode;
  containerClassName?: string;
  hint?: ReactNode;
  error?: string;
};

export function TextareaField({
  label,
  containerClassName,
  hint,
  error,
  id,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...props
}: TextareaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const message = error || hint;

  return (
    <label className={containerClassName} htmlFor={inputId}>
      {label}
      <textarea
        {...props}
        id={inputId}
        aria-invalid={error ? true : invalid}
        aria-describedby={
          [describedBy, message ? `${inputId}-message` : undefined]
            .filter(Boolean)
            .join(' ') || undefined
        }
      />
      {message && (
        <span
          id={`${inputId}-message`}
          className={error ? 'field-error' : 'field-hint'}
        >
          {message}
        </span>
      )}
    </label>
  );
}
