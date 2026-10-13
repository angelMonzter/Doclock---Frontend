import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthSession, AuthUser } from '@/types/auth';
import { authService } from '@/services/auth/authService';
import {
  getToken,
  sessionExpiredEvent,
  setToken,
} from '@/services/auth/session';

//code mode usuarios: restaura la sesión con /me y limpia datos al salir o vencer el token.
const AuthContext = createContext<{
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  retrySession: () => void;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
  updateProfile: (id: string, name: string, email: string) => void;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    setLoading(false);
    setError(null);
    void client.cancelQueries();
    client.clear();
  }, [client]);

  useEffect(() => {
    window.addEventListener(sessionExpiredEvent, signOut);
    return () => window.removeEventListener(sessionExpiredEvent, signOut);
  }, [signOut]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    authService
      .me(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted && getToken() === token) setUser(next);
      })
      .catch((reason: Error) => {
        if (!controller.signal.aborted && getToken() === token)
          setError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!user?.id) return;
    let controller: AbortController | undefined;
    async function refreshPermissions() {
      const token = getToken();
      if (!token || controller || document.visibilityState === 'hidden') return;
      const request = new AbortController();
      controller = request;
      try {
        const next = await authService.me(request.signal);
        if (!request.signal.aborted && getToken() === token) setUser(next);
      } catch {
        // Los fallos transitorios conservan la sesión; HTTP 401 cierra el acceso.
      } finally {
        if (controller === request) controller = undefined;
      }
    }
    window.addEventListener('focus', refreshPermissions);
    document.addEventListener('visibilitychange', refreshPermissions);
    return () => {
      controller?.abort();
      window.removeEventListener('focus', refreshPermissions);
      document.removeEventListener('visibilitychange', refreshPermissions);
    };
  }, [user?.id]);

  function signIn(session: AuthSession) {
    void client.cancelQueries();
    client.clear();
    setToken(session.token);
    setUser(session.user);
    setLoading(false);
    setError(null);
  }

  function updateProfile(id: string, name: string, email: string) {
    setUser((current) =>
      current?.id === id ? { ...current, name, email } : current,
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signOut,
        updateProfile,
        retrySession: () => setAttempt((current) => current + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth requiere AuthProvider');
  return value;
}
