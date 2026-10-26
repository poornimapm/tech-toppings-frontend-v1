import { lazy, Suspense } from 'react';

import { useSession } from '@/core/auth/session-store';
import { loadTour, shouldShowTour, useTour } from '@/platform/onboarding/tour-store';

const Tour = lazy(async () => ({ default: (await loadTour()).Tour }));

/** Opens the tour for a just-made account, or when asked again; marks it seen when closed. */
export function TourHost() {
  const user = useSession((state) => state.user);
  const seen = useTour((state) => state.seen);
  const requested = useTour((state) => state.requested);
  const finish = useTour((state) => state.finish);

  if (!user || !shouldShowTour(user, { seen, requested })) return null;
  return (
    <Suspense fallback={null}>
      <Tour
        onDone={() => {
          finish(user.id);
        }}
      />
    </Suspense>
  );
}
