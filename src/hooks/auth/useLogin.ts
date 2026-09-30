import { useMutation } from '@tanstack/react-query';
import { mockAuthService } from '@/services/auth/mockAuthService';
import { useAuth } from '@/providers/AuthProvider';
export function useLogin() {
  const { signIn } = useAuth();
  return useMutation({
    mutationFn: mockAuthService.login,
    onSuccess: signIn,
    retry: false,
  });
}
