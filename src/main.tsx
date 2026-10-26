import '@/core/theme/tokens.css';
import '@/core/auth/install';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { createQueryClient } from '@/core/api/query-client';
import { env } from '@/core/config/env';
import { i18nReady } from '@/core/i18n';
import { listenForOpen } from '@/core/pwa/open-from-notification';
import { listenForInstall, registerServiceWorker } from '@/core/pwa/register';
import { App } from '@/platform/shell/app';
import { createAppRouter } from '@/platform/shell/routes';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root is missing from index.html');
}

document.title = env.appName;
listenForInstall();
// After the first paint: installing the offline copy must not compete with opening the app.
window.addEventListener('load', () => {
  registerServiceWorker().catch((error: unknown) => {
    console.warn('Service worker not registered', error);
  });
});

// The person's language first (Tamil and Hindi are fetched): no flash of English.
await i18nReady.catch(() => undefined);

const router = createAppRouter();
// A clicked notification routes this window in place, without a reload; a form with unsaved
// input asks before it is left (the unsaved-work guard).
listenForOpen((path) => router.navigate(path));

createRoot(container).render(
  <StrictMode>
    <App router={router} queryClient={createQueryClient()} />
  </StrictMode>,
);
