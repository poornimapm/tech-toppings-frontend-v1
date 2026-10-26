import { onlineManager } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { networkError } from '@/core/api/api-error';
import { createQueryClient } from '@/core/api/query-client';

afterEach(() => {
  onlineManager.setOnline(true);
});

describe('createQueryClient', () => {
  it('tries a change at once with no network, instead of pausing it unseen', async () => {
    const client = createQueryClient();
    onlineManager.setOnline(false);
    const send = vi.fn(() => Promise.reject(networkError(new TypeError('offline'))));

    const change = client.getMutationCache().build(client, { mutationFn: send });

    await expect(change.execute(undefined)).rejects.toMatchObject({ status: 0 });
    expect(send).toHaveBeenCalledOnce();
  });
});
