import { useEffect, useRef, type ReactNode } from 'react';
export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [title]);
  return <header className="page-header"><div><h1 ref={heading} tabIndex={-1} data-page-heading>{title}</h1><p>{description}</p></div>{action && <div className="page-actions">{action}</div>}</header>;
}
