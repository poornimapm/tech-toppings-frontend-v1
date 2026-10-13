import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { signOut } from '@/core/auth/session';

/** Sign out, drop every cached response, and go to the sign-in page. */
export function useSignOut(): () => void {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useCallback(() => {
    void signOut().finally(() => {
      queryClient.clear();
      void navigate('/login', { replace: true });
    });
  }, [navigate, queryClient]);
}
