import { screen, waitFor } from '@testing-library/react';
import { Box } from 'lucide-react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';

import type { AgentRun } from '@/core/agents/queries';
import { useFeedText } from '@/core/modules/feed-text';
import { buildRegistry, ModuleRegistryContext } from '@/core/modules/registry';
import { defineModule } from '@/core/modules/types';
import { useAgentText } from '@/platform/palette/agent-text';
import { useClientActions } from '@/platform/palette/client-actions';
import { resetModuleState, testModules, testRun } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

// A module brings its own words and pages: nothing in the shell names it.
const demo = defineModule({
  key: 'demo_notes',
  icon: Box,
  accent: 'teal',
  strings: {
    en: {
      name: 'Demo notes',
      tagline: 'Jot',
      description: 'Demo.',
      replies: { 'take-notes.ready.open': 'Here are your {{count}} notes.' },
      feed: { 'demo_notes.added': 'Wrote “{{title}}” in {{module}}' },
    },
  },
  routes: [{ index: true, element: <p>Notes list</p> }],
  actions: { demo_notes_open: '', demo_notes_recent: 'recent' },
});
const registry = buildRegistry({ '/src/modules/demo-notes/manifest.ts': { default: demo } });

function Probe({ run }: { run: AgentRun }) {
  const agentText = useAgentText();
  const clientAction = useClientActions();
  const feedText = useFeedText();
  return (
    <>
      <p>{agentText.runMessage(run)}</p>
      <p>{feedText('demo_notes.added', { module: 'demo_notes', title: 'Milk' })}</p>
      <p>{feedText('demo_notes.unknown', { module: 'demo_notes' })}</p>
      {run.client_actions.map((action) => {
        const view = clientAction(action);
        return view ? (
          <button key={action.tool} type="button" onClick={view.run}>
            {`${view.label} (${action.tool})`}
          </button>
        ) : (
          <p key={action.tool}>{`no action for ${action.tool}`}</p>
        );
      })}
    </>
  );
}

function renderProbe(available: boolean) {
  resetModuleState([
    {
      ...testModules[0],
      key: 'demo_notes',
      slug: 'demo-notes',
      status: 'live',
      available,
    } as (typeof testModules)[number],
  ]);
  const run = testRun({
    message_code: 'take-notes.ready.open',
    message_params: { count: 3 },
    proposals: [],
    client_actions: ['demo_notes_open', 'demo_notes_recent', 'someone_elses_tool'].map((tool) => ({
      tool,
      arguments: {},
    })),
  });
  const router = createMemoryRouter([{ path: '*', element: <Probe run={run} /> }]);
  const view = renderWithProviders(
    <ModuleRegistryContext value={registry}>
      <RouterProvider router={router} />
    </ModuleRegistryContext>,
  );
  return { ...view, router };
}

describe('what a module contributes to the shell', () => {
  it('words its own assistant replies and feed entries', async () => {
    renderProbe(true);

    expect(await screen.findByText('Here are your 3 notes.')).toBeInTheDocument();
    expect(screen.getByText('Wrote “Milk” in Demo notes')).toBeInTheDocument();
    expect(screen.getByText('demo_notes.unknown')).toBeInTheDocument(); // shown, not hidden
  });

  it('opens its own pages for the assistant, and only its own', async () => {
    const { user, router } = renderProbe(true);

    await user.click(
      await screen.findByRole('button', { name: 'Open Demo notes (demo_notes_recent)' }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/m/demo-notes/recent');
    });
    expect(screen.getByText('no action for someone_elses_tool')).toBeInTheDocument();
  });

  it('offers nothing while the module is switched off', async () => {
    renderProbe(false);

    expect(await screen.findByText('no action for demo_notes_open')).toBeInTheDocument();
  });
});
