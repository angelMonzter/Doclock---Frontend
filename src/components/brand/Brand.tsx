import logoSistema from '@/logo_sistema.png';
import { cn } from '@/lib/utils';

export function Brand({
  inverse = false,
  className,
}: {
  inverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('brand', inverse && 'brand-inverse', className)}>
      <img
        className="brand-logo"
        src={logoSistema}
        alt="Logo del sistema"
        width={2396}
        height={1248}
      />
    </div>
  );
}
