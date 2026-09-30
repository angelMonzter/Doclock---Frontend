import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { brand } from '@/config/brand';
export function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const names: Record<string, string> = { '/login': 'Iniciar sesión', '/dashboard': 'Inicio', '/documentos': 'Documentos', '/subir': 'Subir archivos' };
    document.title = `${names[pathname] ?? 'Inicio'} · ${brand.name}`;
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
