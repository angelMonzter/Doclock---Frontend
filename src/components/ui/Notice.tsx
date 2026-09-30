import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error' | 'success';
  children: ReactNode;
}) {
  const Icon = tone === 'success' ? CircleCheck : CircleAlert;
  return (
    <div
      className={cn('notice', `notice-${tone}`)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon size={19} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
