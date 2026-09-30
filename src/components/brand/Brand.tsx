import { LibraryBig } from 'lucide-react';
import { brand } from '@/config/brand';
import { cn } from '@/lib/utils';

export function Brand({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return <div className={cn('brand', inverse && 'brand-inverse', className)}>
    <span className="brand-mark"><LibraryBig size={24} strokeWidth={1.7} aria-hidden="true" /></span>
    <div><span className="brand-name">{brand.name}</span><span className="brand-description">{brand.descriptor}</span></div>
  </div>;
}
