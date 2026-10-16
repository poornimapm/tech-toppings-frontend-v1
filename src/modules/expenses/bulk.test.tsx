import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { errorEnvelope, server } from '@/test/msw';
import { renderApp } from '@/test/render';

// 11:30 on Thursday 8 October 2026 in Kolkata (the test user's time zone).
const NOW = new Date('2026-10-08T06:00:00Z');
let fake: ReturnType<typeof fakeExpenses>;

/** The list in select mode. */
async function selecting(path = '/m/expenses') {
  const view = renderApp(path);
  await screen.findByRole('heading', { level: 1, name: 'Expenses' });
  await screen.findAllByRole('listitem');
  await view.user.click(screen.getByRole('button', { name: 'Select' }));
  return view;
}

const bar = () => within(screen.getByRole('region', { name: 'Change the entries selected' }));
const bulkCalls = () =>
  fake.requests.filter((request) => request.path === '/entries/bulk-update').map((r) => r.body);

beforeAll(async () => {
  await import('@/modules/expenses/entries-page');
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  fake = fakeExpenses();
  server.use(...fake.handlers);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('bulk changes on the list', () => {
  it('moves the entries ticked to a category, and says what was skipped', async () => {
    const { user } = await selecting();
    for (const title of ['Rice', 'Bus pass', 'Salary']) {
      await user.click(screen.getByRole('checkbox', { name: `Select “${title}”` }));
    }
    expect(bar().getByText('3 selected')).toBeInTheDocument();

    await user.click(bar().getByRole('button', { name: 'Category' }));
    const dialog = within(
      await screen.findByRole('dialog', { name: 'Move 3 entries to a category' }),
    );
    await user.click(dialog.getByRole('button', { name: 'Move 3 entries' }));
    expect(dialog.getByText('Choose a category.')).toBeInTheDocument();
    expect(bulkCalls()).toEqual([]);

    await user.selectOptions(dialog.getByRole('combobox', { name: 'Category' }), '🐶 Pets');
    await user.click(dialog.getByRole('button', { name: 'Move 3 entries' }));
    expect(await screen.findByText('Moved 2 entries to Pets.')).toBeInTheDocument();
    expect(
      screen.getByText('1 kept its category: that one is for the other kind of entry.'),
    ).toBeInTheDocument();
    expect(bulkCalls()).toEqual([
      { ids: ['e-rice', 'e-bus', 'e-pay'], action: 'category', category_id: 'c-pets' },
    ]);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(await screen.findByText('Pets · Big Bazaar · #home')).toBeInTheDocument();
    expect(bar().getByText('3 selected')).toBeInTheDocument(); // still ticked, for another change
  });

  it('tags every entry shown, and takes the tag off again', async () => {
    const { user } = await selecting();
    await user.click(bar().getByRole('button', { name: 'Select all 3' }));
    expect(bar().getByText('3 selected')).toBeInTheDocument();

    await user.click(bar().getByRole('button', { name: 'Tags' }));
    let dialog = within(await screen.findByRole('dialog', { name: 'Tag 3 entries' }));
    await user.type(dialog.getByRole('textbox', { name: 'Tag' }), ' Goa ');
    await user.click(dialog.getByRole('button', { name: 'Add tag' }));
    expect(await screen.findByText('Tagged 3 entries #goa.')).toBeInTheDocument();

    await user.click(bar().getByRole('button', { name: 'Tags' }));
    dialog = within(await screen.findByRole('dialog', { name: 'Tag 3 entries' }));
    await user.type(dialog.getByRole('textbox', { name: 'Tag' }), 'goa');
    await user.click(dialog.getByRole('button', { name: 'Take tag off' }));
    expect(await screen.findByText('Took #goa off 3 entries.')).toBeInTheDocument();
    expect(bulkCalls()).toEqual([
      { ids: ['e-rice', 'e-bus', 'e-pay'], action: 'add_tag', tag: 'goa' },
      { ids: ['e-rice', 'e-bus', 'e-pay'], action: 'remove_tag', tag: 'goa' },
    ]);
    await user.click(bar().getByRole('button', { name: 'Clear selection' }));
    expect(bar().getByText('0 selected')).toBeInTheDocument();
  });

  it('deletes the entries ticked, and brings them back from the message', async () => {
    const { user } = await selecting();
    await user.click(screen.getByRole('checkbox', { name: 'Select “Rice”' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select “Bus pass”' }));
    await user.click(bar().getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Deleted 2 entries.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Rice' })).toBeNull();
    });
    expect(bar().getByText('0 selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByText('Brought back 2 entries.')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Rice' })).toBeInTheDocument();
    expect(bulkCalls()).toEqual([
      { ids: ['e-rice', 'e-bus'], action: 'delete' },
      { ids: ['e-rice', 'e-bus'], action: 'undelete' },
    ]);
  });

  it('only brings back entries on the deleted list', async () => {
    const { user } = await selecting('/m/expenses?show=deleted');
    expect(bar().queryByRole('button', { name: 'Delete' })).toBeNull();
    await user.click(screen.getByRole('checkbox', { name: 'Select “Mistake”' }));
    await user.click(bar().getByRole('button', { name: 'Bring back' }));
    expect(await screen.findByText('Brought back 1 entry.')).toBeInTheDocument();
    expect(bulkCalls()).toEqual([{ ids: ['e-gone'], action: 'undelete' }]);
  });

  it('stops selecting, and the rows are plain links again', async () => {
    const { user } = await selecting();
    expect(screen.getByRole('button', { name: 'Select' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(bar().getByRole('button', { name: 'Stop selecting' }));
    expect(screen.queryAllByRole('checkbox')).toEqual([]);
    expect(screen.queryByRole('region', { name: 'Change the entries selected' })).toBeNull();
  });

  it('explains a change too big to make at once', async () => {
    server.use(
      http.post('*/api/v1/expenses/entries/bulk-update', () =>
        HttpResponse.json(errorEnvelope('VALIDATION_ERROR', 'Invalid'), { status: 422 }),
      ),
    );
    const { user } = await selecting();
    await user.click(screen.getByRole('checkbox', { name: 'Select “Rice”' }));
    await user.click(bar().getByRole('button', { name: 'Delete' }));
    expect(
      await bar().findByText(
        "That's more entries than one change can take. Select fewer and try again.",
      ),
    ).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    const { user } = await selecting();
    await user.click(screen.getByRole('checkbox', { name: 'Select “Rice”' }));
    expect(await axe(document.body)).toHaveNoViolations();
    await user.click(bar().getByRole('button', { name: 'Category' }));
    await screen.findByRole('dialog', { name: 'Move 1 entry to a category' });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
