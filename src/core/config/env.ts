import * as z from 'zod/mini'; // tree-shakable build of zod: only what's used ships

/**
 * Browser-visible configuration, validated once at startup.
 * Values come from VITE_* variables (.env / host build settings); every one has a safe default.
 * Never put secrets here: VITE_* values are embedded in the public bundle.
 */
const text = (fallback: string) => z._default(z.string().check(z.trim(), z.minLength(1)), fallback);
const milliseconds = (fallback: number) =>
  z._default(z.coerce.number().check(z.int(), z.positive()), fallback);

const schema = z.object({
  VITE_APP_NAME: text('Tech-Toppings'),
  VITE_API_BASE_URL: text('/api'),
  VITE_WAKE_THRESHOLD_MS: milliseconds(3000),
  VITE_WAKE_MAX_WAIT_MS: milliseconds(90_000),
  VITE_HEALTH_POLL_MS: milliseconds(60_000),
  VITE_CSRF_HEADER: text('X-TT-CSRF'),
  VITE_ASSISTANT_AGENT: text('assistant'),
  VITE_NOTIFICATIONS_POLL_MS: milliseconds(60_000),
  VITE_SPEECH_REGION: text('IN'),
});

export interface AppEnv {
  appName: string;
  apiBaseUrl: string;
  wakeThresholdMs: number;
  wakeMaxWaitMs: number;
  healthPollMs: number;
  /** Must match the backend AUTH_CSRF_HEADER; sent on every API request. */
  csrfHeader: string;
  /** Backend agent behind "Ask" in the command palette (an agents/<name>.md file). */
  assistantAgent: string;
  /** How often the bell re-checks for unread notifications while the app is open. */
  notificationsPollMs: number;
  /** Region of the speech languages (dictation, read-back): `IN` gives en-IN, ta-IN, hi-IN. */
  speechRegion: string;
}

export function parseEnv(raw: Record<string, unknown>): AppEnv {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  const value = result.data;
  return {
    appName: value.VITE_APP_NAME,
    apiBaseUrl: value.VITE_API_BASE_URL,
    wakeThresholdMs: value.VITE_WAKE_THRESHOLD_MS,
    wakeMaxWaitMs: value.VITE_WAKE_MAX_WAIT_MS,
    healthPollMs: value.VITE_HEALTH_POLL_MS,
    csrfHeader: value.VITE_CSRF_HEADER,
    assistantAgent: value.VITE_ASSISTANT_AGENT,
    notificationsPollMs: value.VITE_NOTIFICATIONS_POLL_MS,
    speechRegion: value.VITE_SPEECH_REGION,
  };
}

export const env: AppEnv = parseEnv(import.meta.env);
