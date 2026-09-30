import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TextFieldProps = ComponentProps<'input'> & {
  label: string;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
};
export function TextField({
  label,
  error,
  hint,
  leadingIcon,
  trailingAction,
  id,
  className,
  'aria-describedby': describedBy,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const message = error ?? hint;
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <div className={cn('field-control', error && 'field-invalid')}>
        {leadingIcon && (
          <span className="field-icon" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input
          {...props}
          id={inputId}
          className={cn('field-input', className)}
          aria-invalid={!!error}
          aria-describedby={
            [describedBy, message ? `${inputId}-message` : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          }
        />
        {trailingAction}
      </div>
      {message && (
        <p
          id={`${inputId}-message`}
          className={error ? 'field-error' : 'field-hint'}
        >
          {message}
        </p>
      )}
    </div>
  );
}
