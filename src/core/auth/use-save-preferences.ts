import { useCallback } from 'react';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { useSession, type AuthUser } from '@/core/auth/session-store';
import i18n from '@/core/i18n';
import { toast } from '@/design-system';

type PreferenceChanges = Pick<components['schemas']['UserUpdate'], 'locale' | 'theme' | 'ui_mode'>;
type UiMode = components['schemas']['UiMode'];

/** Numbers the saves, as replies can arrive out of order: only the latest save's reply is
 *  applied, and only the latest Simple mode change is undone when its save fails. It goes back
 *  to `confirmed`, the setting the account is known to have (by the last reply), never to an
 *  earlier change that is still on its way; once that earlier change has answered too, the
 *  screen shows what the account ended up with. */
const saves = {
  latest: 0,
  latestUiMode: 0,
  uiModePending: 0, // Simple mode changes not answered yet
  uiModeFailed: false, // the latest Simple mode change failed and was undone
  confirmed: { user: '', uiMode: 'standard' as UiMode },
};

function undoUiMode(owner: string): void {
  const { user, setUser } = useSession.getState();
  if (user?.id !== owner) return; // signed out (or another account signed in) meanwhile
  setUser({ ...user, ui_mode: saves.confirmed.uiMode });
  toast(i18n.t('uiMode.notSaved'), { tone: 'danger' });
}

function applyReply(reply: AuthUser, save: number): void {
  const { user, setUser } = useSession.getState();
  if (reply.id !== user?.id) return; // another account signed in meanwhile
  saves.confirmed = { user: reply.id, uiMode: reply.ui_mode };
  if (save !== saves.latest) {
    // An older change saved after the latest one failed: with none left on its way, show it.
    const settled = saves.uiModeFailed && saves.uiModePending === 0;
    if (settled && user.ui_mode !== reply.ui_mode) setUser({ ...user, ui_mode: reply.ui_mode });
    return;
  }
  // A Simple mode change still on its way may not be in this reply yet: keep it shown.
  setUser(saves.uiModePending > 0 ? { ...reply, ui_mode: user.ui_mode } : reply);
}

/** Persist an explicit preference change to the account (signed-in users only), so it follows
 *  the user to other devices. Theme and language are kept on this device too, so a failed save
 *  still leaves them applied here. Simple mode lives only on the account: it is applied at once,
 *  and undone (with a note) when the save fails. */
export function useSavePreferences(): (changes: PreferenceChanges) => void {
  return useCallback((changes) => {
    const { status, user, setUser } = useSession.getState();
    if (status !== 'authenticated' || !user) return;
    if (saves.uiModePending === 0 || saves.confirmed.user !== user.id) {
      saves.confirmed = { user: user.id, uiMode: user.ui_mode };
    }
    const save = ++saves.latest;
    if (changes.ui_mode) {
      saves.latestUiMode = save;
      saves.uiModePending += 1;
      saves.uiModeFailed = false;
      setUser({ ...user, ui_mode: changes.ui_mode });
    }
    const answered = () => {
      if (changes.ui_mode) saves.uiModePending -= 1;
    };
    unwrap(api.PATCH('/v1/me', { body: changes })).then(
      (reply) => {
        answered();
        applyReply(reply, save);
      },
      () => {
        answered();
        if (save !== saves.latestUiMode) return;
        saves.uiModeFailed = true;
        undoUiMode(user.id);
      },
    );
  }, []);
}
