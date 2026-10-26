import { useEffect } from 'react';

import { useSession } from '@/core/auth/session-store';

/**
 * Simple mode (U8): larger type, fewer fields and a voice-first home. The account keeps the
 * choice (`ui_mode`), so it follows the person to every device; signed out, the app is standard.
 */
export function useSimpleMode(): boolean {
  return useSession((state) => state.user?.ui_mode === 'simple');
}

/** `<html data-ui-mode>`: tokens.css makes the type larger from there. */
export function useApplyUiMode(): void {
  const simple = useSimpleMode();
  useEffect(() => {
    document.documentElement.dataset.uiMode = simple ? 'simple' : 'standard';
  }, [simple]);
}
