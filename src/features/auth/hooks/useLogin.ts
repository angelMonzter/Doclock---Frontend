import { useMutation } from '@tanstack/react-query';
import { mockAuthService } from '../services/mockAuthService';
import { useAuth } from '../AuthProvider';
export function useLogin() {
  const { signIn } = useAuth();
  return useMutation({ mutationFn: mockAuthService.login, onSuccess: signIn, retry: false });
}
