import { createContext, useContext, useState, type ReactNode } from 'react';
import type { DemoUser } from '@/types/auth';

const key = 'archivo.demo.session.v1';
function readSession(): DemoUser | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    return value?.id === 'demo-user' &&
      typeof value.name === 'string' &&
      typeof value.email === 'string'
      ? value
      : null;
  } catch {
    return null;
  }
}
const AuthContext = createContext<{
  user: DemoUser | null;
  signIn: (user: DemoUser) => void;
  signOut: () => void;
} | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(readSession);
  function signIn(next: DemoUser) {
    setUser(next);
    try {
      sessionStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* Sesión en memoria si el navegador bloquea almacenamiento. */
    }
  }
  function signOut() {
    setUser(null);
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* Sin almacenamiento persistente. */
    }
  }
  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth requiere AuthProvider');
  return value;
}
