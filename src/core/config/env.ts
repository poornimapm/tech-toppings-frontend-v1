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
  /** Folder of the on-device receipt reader's files, on this site (its worker must be). */
  ocrPath: string;
  /** A receipt photo sent to AI is shrunk to this many pixels on its long side... */
  scanPhotoPx: number;
  /** ...and one read on the device to this many (the reader wants more detail). */
  scanReadPx: number;
  /** A read on the device that hasn't started or finished by then has failed. */
  scanReadTimeoutMs: number;
}

/** Where the build publishes the reader's files (vite-plugins/ocr-files.ts). */
declare const __OCR_FILES__: string;

const textOf = (value: unknown) => (typeof value === 'string' ? value : '');

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
  /** Unset: the default; set: a whole number above zero (milliseconds, pixels). */
  const whole = (name: string, fallback: number): number => {
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
    wakeThresholdMs: whole('VITE_WAKE_THRESHOLD_MS', 3000),
    wakeMaxWaitMs: whole('VITE_WAKE_MAX_WAIT_MS', 90_000),
    healthPollMs: whole('VITE_HEALTH_POLL_MS', 60_000),
    csrfHeader: text('VITE_CSRF_HEADER', 'X-TT-CSRF'),
    assistantAgent: text('VITE_ASSISTANT_AGENT', 'assistant'),
    notificationsPollMs: whole('VITE_NOTIFICATIONS_POLL_MS', 60_000),
    speechRegion: text('VITE_SPEECH_REGION', 'IN'),
    ocrPath: text('VITE_OCR_PATH', `${textOf(raw.BASE_URL) || '/'}${__OCR_FILES__}`),
    scanPhotoPx: whole('VITE_SCAN_PHOTO_PX', 1600),
    scanReadPx: whole('VITE_SCAN_READ_PX', 2400),
    scanReadTimeoutMs: whole('VITE_SCAN_READ_TIMEOUT_MS', 120_000),
  };
  // A path on this site: the reader runs as a worker, which a browser loads only from here.
  if (!/^\/(?!\/).*\/$/.test(env.ocrPath)) {
    problems.push('VITE_OCR_PATH: a path on this site, starting and ending with /');
  }
  if (problems.length) {
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
  }
  return env;
}

export const env: AppEnv = parseEnv(import.meta.env);
