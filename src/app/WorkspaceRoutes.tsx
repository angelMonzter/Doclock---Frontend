import { administrationService } from '@/services/administration/mockAdministrationService';
import { Navigate, Outlet } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { AppShell } from '@/layouts/AppShell';
import { useDocuments } from '@/hooks/documents/useDocuments';
import { documentService } from '@/services/documents/mockDocumentService';
import { Notice } from '@/components/ui/Notice';
import { Button } from '@/components/ui/button';

//code mode usuarios: espera /me antes de redirigir y permite reintentar fallos de red.
function SessionStatus() {
  const { loading, error, retrySession, signOut } = useAuth();
  return (
    <main className="login-main">
      {loading ? (
        <p role="status">Validando sesión…</p>
      ) : (
        <Notice tone="error">
          {error}
          <Button variant="secondary" onClick={retrySession}>
            Reintentar
          </Button>
          <Button variant="ghost" onClick={signOut}>
            Volver al acceso
          </Button>
        </Notice>
      )}
    </main>
  );
}

function WorkspaceLayout() {
  const { user, signOut } = useAuth();
  const query = useDocuments();
  const client = useQueryClient();
  function logout() {
    signOut();
    documentService.reset();
    administrationService.reset();
    client.clear();
  }
  return (
    <AppShell
      userName={user!.name}
      storageBytes={query.data?.storageBytes}
      capacityBytes={query.data?.policy.capacityBytes}
      storageError={query.isError}
      onSignOut={logout}
    >
      <Outlet />
    </AppShell>
  );
}
export function ProtectedWorkspace() {
  const { user, loading, error } = useAuth();
  if (loading || error) return <SessionStatus />;
  return user ? <WorkspaceLayout /> : <Navigate to="/login" replace />;
}
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useAuth();
  if (loading || error) return <SessionStatus />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}
