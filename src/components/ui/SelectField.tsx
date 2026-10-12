import { useId, type ComponentProps, type ReactNode } from 'react';

export type SelectFieldProps = ComponentProps<'select'> & {
  label: ReactNode;
  containerClassName?: string;
  hint?: ReactNode;
  error?: string;
};

export function SelectField({
  label,
  containerClassName,
  hint,
  error,
  id,
  children,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const message = error || hint;

  return (
    <label className={containerClassName} htmlFor={inputId}>
      {label}
      <select
        {...props}
        id={inputId}
        aria-invalid={error ? true : invalid}
        aria-describedby={
          [describedBy, message ? `${inputId}-message` : undefined]
            .filter(Boolean)
            .join(' ') || undefined
        }
      >
        {children}
      </select>
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
