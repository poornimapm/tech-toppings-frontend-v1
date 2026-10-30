import { env } from '@/core/config/env';
import { OCR_LANGUAGES, ocrParameters } from '@/core/scan/ocr-settings';
import { rgbaOf, type Grey } from '@/core/scan/photo-image';
import type { PrepareJob } from '@/core/scan/prepare.worker';

/** A photo for AI leaves the device re-encoded as a JPEG: the picture only, without the
 *  location or camera details its file may carry. */
export const PHOTO_TYPE = 'image/jpeg';
const PHOTO_QUALITY = 0.85;
/** The smallest valid WebAssembly module using SIMD: the reader's faster engine needs it. */
const SIMD_PROBE = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15,
  253, 98, 11,
]);

/** The photo upright (as its camera saw it), drawn no larger than `side` on its long side. */
async function draw(photo: Blob, side: number): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(photo, { imageOrientation: 'from-image' });
  const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

/** The photo as it is sent to AI: smaller, and a JPEG of the picture alone. */
export async function shrink(photo: Blob): Promise<Blob> {
  const canvas = await draw(photo, env.scanPhotoPx);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('The photo could not be read.'));
      },
      PHOTO_TYPE,
      PHOTO_QUALITY,
    );
  });
}

/** Tried in turn until the photo fits: a little less quality, then a little smaller. */
const QUALITIES = [0.85, 0.75, 0.65, 0.5];
const SMALLER = 0.8;
const SMALLEST_SIDE = 160;

/** The photo as a JPEG of the picture alone, no larger than `side` on its long side and no more
 *  than `maxBytes` (a worker's photo, a picture of an ID): what the server keeps, from a phone
 *  photo of several MB. */
export async function shrinkTo(photo: Blob, side: number, maxBytes: number): Promise<Blob> {
  for (let longest = side; longest >= SMALLEST_SIDE; longest = Math.round(longest * SMALLER)) {
    const canvas = await draw(photo, longest);
    for (const quality of QUALITIES) {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, PHOTO_TYPE, quality);
      });
      if (!blob) throw new Error('The photo could not be read.');
      if (blob.size <= maxBytes) return blob;
    }
  }
  throw new Error('The photo could not be made small enough.');
}

/** The photo made ready (photo-image.ts) in a worker: it takes seconds on a phone. */
function prepareAside(job: PrepareJob): Promise<Grey> {
  const worker = new Worker(new URL('./prepare.worker.ts', import.meta.url), {
    type: 'module',
  });
  return new Promise<Grey>((resolve, reject) => {
    worker.onmessage = ({ data }: MessageEvent<Grey>) => {
      resolve(data);
    };
    worker.onerror = (event) => {
      reject(new Error(event.message || 'The photo could not be prepared.'));
    };
    worker.postMessage(job, [job.rgba.buffer]);
  }).finally(() => {
    worker.terminate();
  });
}

/** The reader itself couldn't start or finish: its files didn't load (often: no connection
 *  on the first scan), or it took longer than `VITE_SCAN_READ_TIMEOUT_MS`. */
export class ReaderUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('The on-device reader is not available.', { cause });
    this.name = 'ReaderUnavailableError';
  }
}

/** The work, or a ReaderUnavailableError once `failed` says so or the time is up. */
function inTime<T>(work: Promise<T>, failed: Promise<never>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new ReaderUnavailableError('timeout'));
    }, env.scanReadTimeoutMs);
  });
  return Promise.race([work, failed, late]).finally(() => {
    clearTimeout(timer);
  });
}

/** Tesseract.js, with its own files and the settings the samples are measured with. */
async function startReader(language: string, onProgress: (share: number) => void) {
  const { createWorker, OEM, PSM } = await import('tesseract.js').catch((cause: unknown) => {
    throw new ReaderUnavailableError(cause);
  });
  const base = new URL(env.ocrPath, window.location.href).href;
  // The library adds its own slash before a language's file name.
  const folder = base.replace(/\/$/, '');
  const engine = WebAssembly.validate(SIMD_PROBE)
    ? 'tesseract-core-simd-lstm'
    : 'tesseract-core-lstm';
  // The library swallows some load failures (language data, the engine): they reach this
  // handler only, so they end the read here instead of leaving it waiting.
  let fail: (cause: unknown) => void = () => undefined;
  const failed = new Promise<never>((_, reject) => {
    fail = (cause) => {
      reject(new ReaderUnavailableError(cause));
    };
  });
  const starting = createWorker(OCR_LANGUAGES[language] ?? ['eng'], OEM.LSTM_ONLY, {
    workerPath: `${base}worker.min.js`,
    corePath: `${base}${engine}.js`,
    langPath: folder,
    // Kept language data is named for this version's folder, so an update brings new data.
    cachePath: folder,
    workerBlobURL: false,
    errorHandler: fail,
    logger: ({ status, progress }) => {
      if (status === 'recognizing text') onProgress(progress);
    },
  });
  try {
    const worker = await inTime(starting, failed);
    return { worker, parameters: ocrParameters(PSM), failed };
  } catch (cause) {
    // Started after all, too late: ended as soon as it does.
    void starting.then(
      (late) => late.terminate(),
      () => undefined,
    );
    throw cause instanceof ReaderUnavailableError ? cause : new ReaderUnavailableError(cause);
  }
}

/**
 * A photo's text (a receipt, a bill), read on this device: the photo made ready, then Tesseract.js, loaded on
 * first use from the app's own files. Its language data is kept by the reader for the next
 * time; the photo is never kept.
 */
export async function readOnDevice(
  photo: Blob,
  language: string,
  onProgress: (share: number) => void,
): Promise<string> {
  const canvas = await draw(photo, env.scanReadPx);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The photo could not be read.');
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  const ready = await prepareAside({ rgba: data, width, height });
  [canvas.width, canvas.height] = [ready.width, ready.height];
  context.putImageData(new ImageData(rgbaOf(ready), ready.width, ready.height), 0, 0);

  const { worker, parameters, failed } = await startReader(language, onProgress);
  try {
    const reading = worker.setParameters(parameters).then(() => worker.recognize(canvas));
    const { data: found } = await inTime(reading, failed).catch((cause: unknown) => {
      throw new ReaderUnavailableError(cause);
    });
    // The reader keeps columns apart with runs of spaces; one space says the same, shorter.
    return found.text
      .replace(/[^\S\n]+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  } finally {
    await worker.terminate();
  }
}
