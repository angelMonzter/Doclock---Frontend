import { workspaceAccess } from '@/config/workspaceAccess';
import type { AuthUser } from '@/types/auth';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import {
  ArrowUpFromLine,
  FolderClosed,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  HardDrive,
  Tags,
  Users,
  ShieldCheck,
  History,
} from 'lucide-react';
import { Brand } from '@/components/brand/Brand';
import { formatBytes } from '@/lib/format';
import { brand } from '@/config/brand';

type AppShellProps = {
  userName: string;
  permissions: AuthUser['permissions'];
  storageBytes?: number;
  capacityBytes?: number | null;
  storageError?: boolean;
  onSignOut: () => void;
  children: ReactNode;
};

export function AppShell({
  userName,
  permissions,
  storageBytes,
  capacityBytes,
  storageError = false,
  onSignOut,
  children,
}: AppShellProps) {
  const access = workspaceAccess(permissions);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (open) {
      document
        .querySelector<HTMLAnchorElement>('#workspace-navigation nav a')
        ?.focus();
    }
  }, [open]);

  function closeMenu() {
    setOpen(false);
    toggle.current?.focus();
  }

  return (
    <div
      className="workspace"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) closeMenu();
      }}
    >
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <aside
        className={`workspace-sidebar ${open ? 'sidebar-open' : ''}`}
        id="workspace-navigation"
      >
        <Link
          to="/dashboard"
          aria-label={`${brand.name}, ir al inicio`}
          className="sidebar-brand"
        >
          <Brand />
        </Link>

        <p className="sidebar-caption">TU ESPACIO DE TRABAJO</p>

        <nav aria-label="Navegación principal">
          <NavLink to="/dashboard">
            <LayoutDashboard size={19} />
            Inicio
          </NavLink>
          {access.documents && (
            <NavLink to="/documentos">
              <FolderClosed size={19} />
              Documentos
            </NavLink>
          )}
          {access.upload && (
            <NavLink to="/subir">
              <ArrowUpFromLine size={19} />
              Subir archivos
            </NavLink>
          )}
          {access.categories && (
            <NavLink to="/categorias">
              <Tags size={19} />
              Categorías
            </NavLink>
          )}
          {access.users && (
            <NavLink to="/usuarios">
              <Users size={19} />
              Usuarios
            </NavLink>
          )}
          {access.users && (
            <NavLink to="/roles">
              <ShieldCheck size={19} />
              Roles y permisos
            </NavLink>
          )}
          {access.history && (
            <NavLink to="/historial">
              <History size={19} />
              Historial
            </NavLink>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="storage-summary">
            <HardDrive size={19} />
            <strong>Espacio utilizado</strong>
            <p>
              {storageError
                ? 'No se pudo consultar el espacio.'
                : storageBytes === undefined
                  ? 'Calculando…'
                  : capacityBytes == null
                    ? `${formatBytes(storageBytes)} · Sin límite configurado`
                    : `${formatBytes(storageBytes)} de ${formatBytes(capacityBytes)}`}
            </p>
            <progress
              aria-label="Uso del almacenamiento"
              value={
                storageError || storageBytes === undefined
                  ? undefined
                  : capacityBytes === null
                    ? 0
                    : storageBytes
              }
              max={capacityBytes ?? 1}
            />
            <span>Incluye versiones y archivos en papelera.</span>
          </div>

          <button type="button" className="logout-button" onClick={onSignOut}>
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <header className="workspace-topbar">
        <button
          className="icon-button mobile-menu-toggle"
          ref={toggle}
          type="button"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="workspace-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>

        <span className="topbar-label">
          Un lugar para continuar tu trabajo.
        </span>

        <div className="user-summary">
          <span className="user-avatar" aria-hidden="true">
            {userName.slice(0, 1)}
          </span>
          <div>
            <strong>{userName}</strong>
            <span>Sesión activa</span>
          </div>
        </div>
      </header>

      <div className="workspace-body">
        <main id="main-content" className="workspace-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="workspace-footer">
          Carpetas y configuración guardadas en el sistema.
        </footer>
      </div>
    </div>
  );
}
