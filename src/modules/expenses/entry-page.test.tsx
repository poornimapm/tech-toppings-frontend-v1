import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { fakeExpenses } from '@/modules/expenses/testing/fake-api';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';

const NOW = new Date('2026-10-08T06:00:00Z');
let fake: ReturnType<typeof fakeExpenses>;

async function open(id: string, title: string) {
  const view = renderApp(`/m/expenses/entries/${id}`);
  await screen.findByRole('heading', { level: 1, name: title });
  return view;
}

function history() {
  return within(screen.getByRole('region', { name: 'History' }));
}

beforeAll(async () => {
  await Promise.all([
    import('@/modules/expenses/entry-page'),
    import('@/modules/expenses/entries-page'),
  ]);
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  fake = fakeExpenses();
  server.use(...fake.handlers);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('an entry', () => {
  it('shows what it is and where it came from', async () => {
    await open('e-rice', 'Rice');

    const entry = within(screen.getByRole('region', { name: 'Rice' }));
    expect(entry.getByText('−₹125')).toBeInTheDocument();
    expect(entry.getByText('Spent · Groceries')).toBeInTheDocument();
    expect(entry.getByText('Where:').nextElementSibling).toHaveTextContent('Big Bazaar');
    expect(entry.getByText('Paid with:').nextElementSibling).toHaveTextContent('UPI');
    expect(entry.getByText('Tags:').nextElementSibling).toHaveTextContent('#home');
    expect(entry.queryByText('Note:')).toBeNull(); // nothing to show, so no empty row

    expect(await history().findByText('Added')).toBeInTheDocument();
    expect(history().getByText(/by you/)).toBeInTheDocument();
    expect(history().getByText('1 hour ago')).toBeInTheDocument();
    expect(history().getByText('Current')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All entries' })).toHaveAttribute(
      'href',
      '/m/expenses',
    );
  });

  it('is edited, shows what changed, and can go back to an earlier version', async () => {
    const { user } = await open('e-rice', 'Rice');
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const form = within(await screen.findByRole('dialog', { name: 'Edit entry' }));
    expect(form.getByRole('textbox', { name: 'Amount (INR)' })).toHaveValue('125.00');
    expect(form.getByRole('radio', { name: 'Groceries' })).toBeChecked();

    await user.clear(form.getByRole('textbox', { name: 'What was it?' }));
    await user.type(form.getByRole('textbox', { name: 'What was it?' }), 'Basmati rice');
    await user.clear(form.getByRole('textbox', { name: 'Amount (INR)' }));
    await user.type(form.getByRole('textbox', { name: 'Amount (INR)' }), '180');
    await user.click(form.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved Basmati rice')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Basmati rice' })).toBeVisible();
    const saved = fake.requests.find((request) => request.method === 'PUT');
    expect(saved?.body).toMatchObject({
      title: 'Basmati rice',
      amount_minor: 18000,
      revision_no: 1,
    });
    expect(await history().findByText('Edited')).toBeInTheDocument();
    expect(history().getByText('Rice → Basmati rice')).toBeInTheDocument();
    expect(history().getByText('₹125 → ₹180')).toBeInTheDocument();

    await user.click(history().getByRole('button', { name: 'Restore version 1' }));

    expect(await screen.findByText('Restored Rice')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Rice' })).toBeVisible();
    expect(await history().findByText('Restored an earlier version')).toBeInTheDocument();
  });

  it('refuses to overwrite a change made somewhere else', async () => {
    const { user } = await open('e-rice', 'Rice');
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit entry' });
    // Meanwhile, the entry is edited on another device.
    Object.assign(fake.state.entries[0] ?? {}, { title: 'Rice (5 kg)', revision_no: 2 });

    await user.type(within(dialog).getByRole('combobox', { name: 'Where' }), ' Express');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(/^This entry was changed somewhere else/)).toBeInTheDocument();
    expect(fake.state.entries[0]?.merchant).toBe('Big Bazaar'); // nothing was overwritten
    await user.click(screen.getByRole('button', { name: 'Reload entry' }));

    // The form starts again from the latest version, and saving it now works.
    const fresh = within(await screen.findByRole('dialog', { name: 'Edit entry' }));
    await waitFor(() => {
      expect(fresh.getByRole('textbox', { name: 'What was it?' })).toHaveValue('Rice (5 kg)');
    });
    await user.click(
      within(screen.getByRole('dialog', { name: 'Edit entry' })).getByRole('button', {
        name: 'Save',
      }),
    );
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('is deleted with a way to undo it', async () => {
    const { user, router } = await open('e-rice', 'Rice');

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Deleted Rice')).toBeInTheDocument();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/m/expenses');
    });
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Rice' })).toBeNull();
    });
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(await screen.findByRole('link', { name: 'Rice' })).toBeInTheDocument();
    expect(fake.state.entries[0]?.deleted).toBe(false);
  });

  it('can be brought back when deleted, and is not editable until then', async () => {
    const { user } = await open('e-gone', 'Mistake');

    expect(screen.getByText(/^This entry is deleted/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Bring back' }));

    expect(await screen.findByText('Mistake is back')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(await history().findByText('Brought back')).toBeInTheDocument();
  });

  it('says when it cannot be found', async () => {
    renderApp('/m/expenses/entries/nope');

    expect(await screen.findByText("We couldn't find this entry.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All entries' })).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', { timeout: 40_000 }, async () => {
    await open('e-rice', 'Rice');
    await history().findByText('Added');

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
