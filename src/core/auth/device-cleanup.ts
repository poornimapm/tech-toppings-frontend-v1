/**
 * What this device should drop when an account leaves it. Features register their own steps,
 * so auth needs to know nothing about them:
 * - before sign-out (the token still works, so a step may tell the server too);
 * - when the account is deleted (anything kept on the device for that account). The app's other
 *   tabs and windows are told too, and run their own steps: a send under way in one of them
 *   must keep nothing for the account either.
 * Every step is best effort: one that fails or hangs never blocks the others or the sign-out.
 */
type SignOutStep = () => Promise<unknown>;
type ForgetStep = (owner: string) => Promise<unknown> | undefined;

const signOutSteps = new Set<SignOutStep>();
const forgetSteps = new Set<ForgetStep>();

function register<T>(steps: Set<T>, step: T): () => void {
  steps.add(step);
  return () => {
    steps.delete(step);
  };
}

/** Runs every step at once; a throw counts as a failure. Settles once every step has. */
const runAll = (steps: (() => unknown)[]) =>
  Promise.allSettled(steps.map((step) => Promise.resolve().then(step)));

/** Waits for `work`, but no longer than `waitMs`. */
async function atMost(work: Promise<unknown>, waitMs: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, waitMs);
  });
  await Promise.race([work, timeout]);
  clearTimeout(timer);
}

const forgetHere = (owner: string) => runAll([...forgetSteps].map((step) => () => step(owner)));

const CHANNEL = 'tt-device';
let channel: BroadcastChannel | null | undefined;

/** The account a message from another tab says to forget, if it says so. */
const forgetOf = (data: unknown): string | null =>
  typeof data === 'object' && data !== null && 'forget' in data && typeof data.forget === 'string'
    ? data.forget
    : null;

/** The line to the app's other tabs and windows, opened once; null where browsers have none.
 *  A forget heard on it runs this tab's steps, and is not passed on. */
function otherTabs(): BroadcastChannel | null {
  if (channel === undefined) {
    channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL);
    channel?.addEventListener('message', (event: MessageEvent<unknown>) => {
      const owner = forgetOf(event.data);
      if (owner) void forgetHere(owner);
    });
  }
  return channel;
}

export const beforeSignOut = (step: SignOutStep): (() => void) => register(signOutSteps, step);
export const onForgetAccount = (step: ForgetStep): (() => void) => {
  otherTabs(); // from now on, a forget in another tab runs this one
  return register(forgetSteps, step);
};

export function runSignOutSteps(waitMs: number): Promise<void> {
  return atMost(runAll([...signOutSteps]), waitMs);
}

export function forgetAccount(owner: string, waitMs: number): Promise<void> {
  otherTabs()?.postMessage({ forget: owner });
  return atMost(forgetHere(owner), waitMs);
}
