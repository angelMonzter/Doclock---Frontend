import { useId, type ComponentProps, type ReactNode } from 'react';

export type CheckboxFieldProps = Omit<ComponentProps<'input'>, 'type'> & {
  label: ReactNode;
  containerClassName?: string;
};

export function CheckboxField({
  label,
  containerClassName,
  id,
  ...props
}: CheckboxFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className={containerClassName} htmlFor={inputId}>
      <input {...props} id={inputId} type="checkbox" />{' '}
      {label}
    </label>
  );
}
