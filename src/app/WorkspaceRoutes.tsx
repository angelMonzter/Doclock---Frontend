import { Navigate, Outlet } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { AppShell } from '@/components/layout/AppShell';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import { documentService } from '@/features/documents/services/mockDocumentService';
import { getSummary } from '@/features/documents/model';

function WorkspaceLayout() {
  const { user, signOut } = useAuth();
  const query = useDocuments();
  const client = useQueryClient();
  function logout() { signOut(); documentService.reset(); client.clear(); }
  return <AppShell userName={user!.name} storageBytes={query.data ? getSummary(query.data).bytes : undefined} onSignOut={logout}><Outlet /></AppShell>;
}
export function ProtectedWorkspace() {
  const { user } = useAuth();
  return user ? <WorkspaceLayout /> : <Navigate to="/login" replace />;
}
export function GuestOnly({ children }: { children: React.ReactNode }) {
  return useAuth().user ? <Navigate to="/dashboard" replace /> : children;
}
