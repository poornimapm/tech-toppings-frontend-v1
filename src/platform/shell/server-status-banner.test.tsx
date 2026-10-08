import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ServerStatusBanner } from '@/platform/shell/server-status-banner';

describe('ServerStatusBanner', () => {
  it.each(['checking', 'online'] as const)('stays silent while %s', (status) => {
    render(<ServerStatusBanner status={status} onRetry={vi.fn()} />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('explains cold starts while the server wakes up', () => {
    render(<ServerStatusBanner status="waking" onRetry={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent(/Waking up the server/);
  });

  it('offers a retry when the server is unreachable', async () => {
    const onRetry = vi.fn();
    render(<ServerStatusBanner status="offline" onRetry={onRetry} />);

    expect(screen.getByRole('status')).toHaveTextContent("We can't reach the server right now.");
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
