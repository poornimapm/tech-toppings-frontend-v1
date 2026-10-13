import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { userKeys } from '@/core/auth/queries';
import { signOutEverywhere } from '@/core/auth/session';
import { relativeTime } from '@/core/utils/relative-time';
import { describeDevice } from '@/platform/auth/device';
import { Button, Card } from '@/design-system';

type Session = components['schemas']['SessionOut'];

const PAGE_SIZE = 50;

export function SecurityPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const sessions = useQuery({
    queryKey: userKeys.sessions(1),
    queryFn: () =>
      unwrap(api.GET('/v1/me/sessions', { params: { query: { page_size: PAGE_SIZE } } })),
  });

  const revoke = useMutation({
    mutationFn: (sessionId: string) =>
      unwrap(
        api.DELETE('/v1/me/sessions/{session_id}', { params: { path: { session_id: sessionId } } }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });

  const everywhere = useMutation({
    mutationFn: signOutEverywhere,
    onSettled: () => navigate('/login', { replace: true }),
  });

  const items: Session[] = sessions.data?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('security.title')}</h1>
      <Card title={t('security.sessions')}>
        <ul className="divide-y divide-border">
          {items.map((session) => (
            <li key={session.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-medium">
                  {describeDevice(session.user_agent) ?? t('security.unknownDevice')}
                  {session.current && (
                    <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs text-success">
                      {t('security.thisDevice')}
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted">
                  {t('security.lastActive', {
                    when: relativeTime(session.last_used_at, i18n.language),
                  })}
                </p>
              </div>
              {!session.current && (
                <Button
                  variant="secondary"
                  disabled={revoke.isPending}
                  onClick={() => {
                    revoke.mutate(session.id);
                  }}
                >
                  {t('security.signOutDevice')}
                </Button>
              )}
            </li>
          ))}
        </ul>
        {sessions.isSuccess && items.length <= 1 && (
          <p className="pt-2 text-sm text-muted">{t('security.empty')}</p>
        )}
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/change-password"
          className="font-medium text-primary underline underline-offset-4"
        >
          {t('security.changePassword')}
        </Link>
        {confirming ? (
          <div
            role="group"
            aria-label={t('security.signOutEverywhere')}
            className="flex items-center gap-2"
          >
            <p>{t('security.confirmEverywhere')}</p>
            <Button
              onClick={() => {
                everywhere.mutate();
              }}
              disabled={everywhere.isPending}
            >
              {t('security.signOutEverywhere')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setConfirming(false);
              }}
            >
              {t('actions.cancel')}
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              setConfirming(true);
            }}
          >
            {t('security.signOutEverywhere')}
          </Button>
        )}
      </div>
    </div>
  );
}
