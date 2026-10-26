import { act, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { createMemoryRouter, Link } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';

import { UnsavedGuard } from '@/core/forms/unsaved-guard';
import { renderWithProviders } from '@/test/render';

function Field({ name }: { name: string }) {
  const [text, setText] = useState('');
  return (
    <>
      <input
        aria-label={name}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      <UnsavedGuard dirty={text !== ''} />
    </>
  );
}

function renderForm() {
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <>
          <Field name="Note" />
          <Field name="Other" />
          <Link to="/elsewhere">Elsewhere</Link>
          <Link to="/?show=all">Show all</Link>
        </>
      ),
    },
    { path: '/elsewhere', element: <h1>Elsewhere</h1> },
  ]);
  return { router, ...renderWithProviders(<RouterProvider router={router} />) };
}

const ASK = 'Leave without saving?';

/** Whether the browser would ask before the tab is closed or reloaded. */
function unloadAsks(): boolean {
  return !window.dispatchEvent(new Event('beforeunload', { cancelable: true }));
}

describe('the unsaved-work guard', () => {
  it('lets a form with nothing typed be left without asking', async () => {
    const { user } = renderForm();
    expect(unloadAsks()).toBe(false);

    await user.click(screen.getByRole('link', { name: 'Elsewhere' }));

    expect(await screen.findByRole('heading', { name: 'Elsewhere' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('asks before typed input is left: staying keeps it, leaving goes', async () => {
    const { user, router } = renderForm();
    await user.type(screen.getByRole('textbox', { name: 'Note' }), 'half a thought');
    expect(unloadAsks()).toBe(true);

    await user.click(screen.getByRole('link', { name: 'Elsewhere' }));
    const ask = await screen.findByRole('dialog', { name: ASK });
    await user.click(within(ask).getByRole('button', { name: 'Keep editing' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(router.state.location.pathname).toBe('/');
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('half a thought');

    await act(() => router.navigate('/elsewhere')); // e.g. a notification clicked
    await user.click(
      within(await screen.findByRole('dialog', { name: ASK })).getByRole('button', {
        name: 'Leave without saving',
      }),
    );
    expect(await screen.findByRole('heading', { name: 'Elsewhere' })).toBeInTheDocument();
    expect(unloadAsks()).toBe(false); // the form is gone, and so is the question
  });

  it('asks once however many forms hold input, and not for a new filter on the page', async () => {
    const { user, router } = renderForm();
    await user.type(screen.getByRole('textbox', { name: 'Note' }), 'a');
    await user.type(screen.getByRole('textbox', { name: 'Other' }), 'b');

    await user.click(screen.getByRole('link', { name: 'Show all' }));
    expect(router.state.location.search).toBe('?show=all');
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(screen.getByRole('link', { name: 'Elsewhere' }));
    expect(await screen.findAllByRole('dialog', { name: ASK })).toHaveLength(1);
  });

  it('stops asking once the input is cleared', async () => {
    const { user } = renderForm();
    const note = screen.getByRole('textbox', { name: 'Note' });
    await user.type(note, 'x');
    await user.clear(note);

    await user.click(screen.getByRole('link', { name: 'Elsewhere' }));

    expect(await screen.findByRole('heading', { name: 'Elsewhere' })).toBeInTheDocument();
    expect(unloadAsks()).toBe(false);
  });
});
