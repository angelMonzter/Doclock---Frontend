import { HistoryPage } from '@/pages/HistoryPage';
import '@/styles/administration.css';
import { FileSettingsPage } from '@/pages/FileSettingsPage';
import { FileTypesPage } from '@/pages/FileTypesPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { AppearancePage } from '@/pages/AppearancePage';
import { RolesPage } from '@/pages/RolesPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { UsersPage } from '@/pages/UsersPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { LoginPage } from '@/pages/auth/LoginPage';
import { AuthProvider } from '@/providers/AuthProvider';
import { GuestOnly, ProtectedWorkspace } from './WorkspaceRoutes';
import { DashboardPage } from '@/pages/DashboardPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { UploadPage } from '@/pages/UploadPage';
import '@/styles/workspace.css';
import { RouteMetadata } from './RouteMetadata';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <RouteMetadata />
          <Routes>
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <LoginPage />
                </GuestOnly>
              }
            />
            <Route element={<ProtectedWorkspace />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/documentos" element={<DocumentsPage />} />
              <Route path="/subir" element={<UploadPage />} />
              <Route path="/categorias" element={<CategoriesPage />} />
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/historial" element={<HistoryPage />} />
              <Route path="/apariencia" element={<AppearancePage />} />
              <Route path="/configuracion-archivos" element={<FileSettingsPage />} />
              <Route path="/tipos-archivo" element={<FileTypesPage />} />
              <Route path="/mensajes" element={<MessagesPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

