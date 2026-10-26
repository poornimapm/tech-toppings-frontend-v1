/**
 * Browser-visible configuration, validated once at startup.
 * Values come from VITE_* variables (.env / host build settings); every one has a safe default.
 * Never put secrets here: VITE_* values are embedded in the public bundle.
 * (Checked by hand rather than with zod: this runs on every first page, which zod would weigh.)
 */
type Raw = Record<string, unknown>;

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

export function parseEnv(raw: Raw): AppEnv {
  const problems: string[] = [];
  /** Unset: the default; set: trimmed, and never empty. */
  const text = (name: string, fallback: string): string => {
    const given = raw[name];
    if (given === undefined) return fallback;
    const value = typeof given === 'string' ? given.trim() : '';
    if (!value) problems.push(`${name}: must not be empty`);
    return value;
  };
  /** Unset: the default; set: a whole number of milliseconds above zero. */
  const milliseconds = (name: string, fallback: number): number => {
    if (raw[name] === undefined) return fallback;
    const value = Number(raw[name]);
    if (!Number.isInteger(value) || value <= 0) {
      problems.push(`${name}: must be a whole number above 0`);
    }
    return value;
  };

  const env: AppEnv = {
    appName: text('VITE_APP_NAME', 'Tech-Toppings'),
    apiBaseUrl: text('VITE_API_BASE_URL', '/api'),
    wakeThresholdMs: milliseconds('VITE_WAKE_THRESHOLD_MS', 3000),
    wakeMaxWaitMs: milliseconds('VITE_WAKE_MAX_WAIT_MS', 90_000),
    healthPollMs: milliseconds('VITE_HEALTH_POLL_MS', 60_000),
    csrfHeader: text('VITE_CSRF_HEADER', 'X-TT-CSRF'),
    assistantAgent: text('VITE_ASSISTANT_AGENT', 'assistant'),
    notificationsPollMs: milliseconds('VITE_NOTIFICATIONS_POLL_MS', 60_000),
    speechRegion: text('VITE_SPEECH_REGION', 'IN'),
  };
  if (problems.length) {
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
  }
  return env;
}

export const env: AppEnv = parseEnv(import.meta.env);
