import { screen } from '@testing-library/react';
import { Box } from 'lucide-react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';

import { buildRegistry, ModuleRegistryContext } from '@/core/modules/registry';
import { defineModule } from '@/core/modules/types';
import { moduleRoutes } from '@/platform/shell/module-routes';
import { resetModuleState, testModules } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const demo = defineModule({
  key: 'demo_notes',
  icon: Box,
  accent: 'teal',
  strings: { en: { name: 'Demo notes', tagline: 'Jot', description: 'Demo.' } },
  routes: [
    { index: true, element: <p>Notes list</p> },
    { path: 'new', element: <p>New note</p> },
  ],
});
const registry = buildRegistry({ '/src/modules/demo-notes/manifest.ts': { default: demo } });

function renderAt(path: string) {
  const router = createMemoryRouter(moduleRoutes(registry), { initialEntries: [path] });
  renderWithProviders(
    <ModuleRegistryContext value={registry}>
      <RouterProvider router={router} />
    </ModuleRegistryContext>,
  );
}

function demoView(available: boolean) {
  return {
    ...testModules[0],
    key: 'demo_notes',
    slug: 'demo-notes',
    status: 'live',
    available,
  } as (typeof testModules)[number];
}

describe('module routes', () => {
  it('mounts only modules that ship pages', () => {
    expect(moduleRoutes(registry).map((route) => route.path)).toEqual(['m/demo-notes']);
    expect(moduleRoutes().map((route) => route.path)).toEqual(['m/expenses']);
  });

  it('renders a module page while the module is available', async () => {
    resetModuleState([demoView(true)]);
    renderAt('/m/demo-notes/new');

    expect(await screen.findByText('New note')).toBeInTheDocument();
  });

  it('explains when the module is turned off or not launched', async () => {
    resetModuleState([demoView(false)]);
    renderAt('/m/demo-notes');

    expect(
      await screen.findByRole('heading', { name: "Demo notes isn't available" }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Notes list')).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to your modules' })).toHaveAttribute('href', '/');
  });
});
