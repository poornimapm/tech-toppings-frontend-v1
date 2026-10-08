import { isRouteErrorResponse, useRouteError } from 'react-router';

import { ErrorFallback } from '@/platform/shell/error-fallback';
import { NotFoundPage } from '@/platform/shell/not-found-page';

/** errorElement of the root route: 404 responses get the not-found page, anything else the
 *  generic fallback (details go to the console, never to the screen). */
export function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }
  console.error('Route error', error);
  return <ErrorFallback />;
}
