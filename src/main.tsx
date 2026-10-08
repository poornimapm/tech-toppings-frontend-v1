import '@/core/theme/tokens.css';
import '@/core/i18n';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { createQueryClient } from '@/core/api/query-client';
import { env } from '@/core/config/env';
import { App } from '@/platform/shell/app';
import { createAppRouter } from '@/platform/shell/routes';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root is missing from index.html');
}

document.title = env.appName;

createRoot(container).render(
  <StrictMode>
    <App router={createAppRouter()} queryClient={createQueryClient()} />
  </StrictMode>,
);
