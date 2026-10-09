// Connects the API client to the session (imported once, from main.tsx and the test setup).
import { api } from '@/core/api/client';
import { createAuthMiddleware } from '@/core/auth/auth-middleware';
import { refreshSession } from '@/core/auth/session';
import { useSession } from '@/core/auth/session-store';
import { env } from '@/core/config/env';

api.use(
  createAuthMiddleware({
    csrfHeader: env.csrfHeader,
    getToken: () => useSession.getState().accessToken,
    refresh: async () => (await refreshSession()).access_token,
    onSessionEnded: () => {
      useSession.getState().clear();
    },
    onPasswordChangeRequired: () => {
      const { user, setUser } = useSession.getState();
      if (user && !user.must_change_password) setUser({ ...user, must_change_password: true });
    },
  }),
);
