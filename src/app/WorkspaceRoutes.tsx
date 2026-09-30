import { administrationService } from '@/services/administration/mockAdministrationService';
import { Navigate, Outlet } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { AppShell } from '@/layouts/AppShell';
import { useDocuments } from '@/hooks/documents/useDocuments';
import { documentService } from '@/services/documents/mockDocumentService';
import { getSummary } from '@/models/documents';

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
      storageBytes={query.data ? getSummary(query.data).bytes : undefined}
      onSignOut={logout}
    >
      <Outlet />
    </AppShell>
  );
}
export function ProtectedWorkspace() {
  const { user } = useAuth();
  return user ? <WorkspaceLayout /> : <Navigate to="/login" replace />;
}
export function GuestOnly({ children }: { children: React.ReactNode }) {
  return useAuth().user ? <Navigate to="/dashboard" replace /> : children;
}

