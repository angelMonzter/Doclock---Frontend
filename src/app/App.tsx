import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { GuestOnly, ProtectedWorkspace } from './WorkspaceRoutes';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { DocumentsPage } from '@/features/documents/pages/DocumentsPage';
import { UploadPage } from '@/features/documents/pages/UploadPage';
import '@/styles/workspace.css';
import { RouteMetadata } from './RouteMetadata';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

export function App() {
  return <QueryClientProvider client={queryClient}><AuthProvider><BrowserRouter><RouteMetadata /><Routes>
    <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
    <Route element={<ProtectedWorkspace />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/documentos" element={<DocumentsPage />} />
      <Route path="/subir" element={<UploadPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes></BrowserRouter></AuthProvider></QueryClientProvider>;
}
