import { useMutation } from '@tanstack/react-query';
//code mode usuarios: login real; la sesión se establece solo tras una respuesta exitosa.
import { authService } from '@/services/auth/authService';
import { useAuth } from '@/providers/AuthProvider';
export function useLogin() {
  const { signIn } = useAuth();
  return useMutation({
    mutationFn: authService.login,
    onSuccess: signIn,
    retry: false,
  });
}
