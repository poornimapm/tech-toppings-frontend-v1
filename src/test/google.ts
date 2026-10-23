import { waitFor } from '@testing-library/react';
import { expect, vi } from 'vitest';

type Callback = (response: { credential: string }) => void;

/**
 * Google Identity Services, faked on `window.google` (remove it after the test): `signIn`
 * answers the Google button the page rendered last, as a person picking their account would.
 */
export function fakeGoogle() {
  let callback: Callback | undefined;
  window.google = {
    accounts: {
      id: {
        initialize: vi.fn((options: { callback: Callback }) => {
          callback = options.callback;
        }),
        renderButton: vi.fn(),
      },
    },
  };
  return {
    signIn: async (credential: string) => {
      await waitFor(() => {
        expect(callback).toBeDefined();
      });
      callback?.({ credential });
    },
  };
}
