import { act, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useSession } from '@/core/auth/session-store';
import { loadOutbox, setOutboxStorage } from '@/core/offline/outbox';
import { memoryStorage, type OutboxItem } from '@/core/offline/outbox-storage';
import { OutboxBanner } from '@/platform/shell/outbox-banner';
import { testUser } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const item = (changes: Partial<OutboxItem>): OutboxItem => ({
  id: 'tea',
  kind: 'm.x',
  owner: testUser.id,
  label: 'Tea',
  payload: {},
  queuedAt: '2026-10-08T06:00:00Z',
  ...changes,
});

beforeEach(async () => {
  const storage = memoryStorage();
  setOutboxStorage(storage);
  useSession.setState({ status: 'authenticated', user: testUser });
  await storage.put(item({ failure: 'EXPENSE_CATEGORY_INVALID' }));
  await storage.put(item({ id: 'other', owner: 'someone-else', label: 'Not mine' }));
  await act(loadOutbox);
});

const REFUSED = "“Tea” wasn't saved: Choose one of your categories for this kind of entry.";

describe('the outbox banner', () => {
  it('shows what the server refused, to send again once its cause is fixed', async () => {
    const { user } = renderWithProviders(<OutboxBanner />);
    expect(screen.getByText(REFUSED)).toBeInTheDocument();
    expect(screen.queryByText(/Not mine/)).toBeNull();

    // Its name starts with what it shows (Label in Name): "Try again" said aloud finds it.
    await user.click(screen.getByRole('button', { name: 'Try again to send “Tea”' }));

    expect(
      await screen.findByText('1 thing you added offline is waiting to be sent.'),
    ).toBeVisible();
    expect(screen.queryByText(REFUSED)).toBeNull();
  });

  it('lets a refused item be discarded', async () => {
    const { user } = renderWithProviders(<OutboxBanner />);

    await user.click(screen.getByRole('button', { name: 'Discard “Tea”' }));

    await waitFor(() => {
      expect(screen.queryByText(REFUSED)).toBeNull();
    });
    expect(screen.queryByRole('button', { name: /Tea/ })).toBeNull();
  });
});
