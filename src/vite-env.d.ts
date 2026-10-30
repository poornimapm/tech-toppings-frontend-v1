/// <reference types="vite/client" />

/** Browser-visible configuration (see .env.example and src/core/config/env.ts). */
interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WAKE_THRESHOLD_MS?: string;
  readonly VITE_WAKE_MAX_WAIT_MS?: string;
  readonly VITE_HEALTH_POLL_MS?: string;
  readonly VITE_CSRF_HEADER?: string;
  readonly VITE_OCR_PATH?: string;
  readonly VITE_SCAN_PHOTO_PX?: string;
  readonly VITE_SCAN_READ_PX?: string;
  readonly VITE_SCAN_READ_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
