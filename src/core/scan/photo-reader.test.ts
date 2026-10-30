import { createWorker } from 'tesseract.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '@/core/config/env';
import { OCR_LANGUAGES } from '@/core/scan/ocr-settings';
import { PHOTO_TYPE, ReaderUnavailableError, readOnDevice, shrink } from '@/core/scan/photo-reader';

// The reader's seams to the browser (the camera's bitmap, the canvas, the worker that prepares
// the photo, Tesseract.js) are faked: the photo's preparation has its own tests, and
// `npm run receipt-samples ocr` measures the reader itself.
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(),
  OEM: { LSTM_ONLY: 1 },
  PSM: { SINGLE_BLOCK: '6' },
}));

type Options = Parameters<typeof createWorker>[2] & { errorHandler: (cause: unknown) => void };

const reader = {
  setParameters: vi.fn(),
  recognize: vi.fn(),
  terminate: vi.fn(),
};
const PHOTO = new Blob(['RAW'], { type: 'image/jpeg' });

/** What createWorker was asked for, on its last call. */
function asked(): { languages: unknown; options: Options } {
  const call = vi.mocked(createWorker).mock.lastCall;
  if (!call) throw new Error('createWorker was not called');
  return { languages: call[0], options: call[2] as Options };
}

beforeEach(() => {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(() => Promise.resolve({ width: 4000, height: 3000, close: vi.fn() })),
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    const { width, height } = this;
    return {
      drawImage: vi.fn(),
      putImageData: vi.fn(),
      getImageData: () => ({ data: new Uint8ClampedArray(width * height * 4), width, height }),
    } as unknown as CanvasRenderingContext2D;
  });
  vi.stubGlobal(
    'ImageData',
    class {
      constructor(
        readonly data: Uint8ClampedArray,
        readonly width: number,
        readonly height: number,
      ) {}
    },
  );
  // The worker that prepares the photo: answers with a small grey picture.
  vi.stubGlobal(
    'Worker',
    class {
      onmessage: ((event: { data: unknown }) => void) | null = null;
      onerror: ((event: { message: string }) => void) | null = null;
      postMessage() {
        queueMicrotask(() => {
          this.onmessage?.({ data: { pixels: new Uint8Array(4), width: 2, height: 2 } });
        });
      }
      terminate = vi.fn();
    },
  );
  reader.setParameters.mockResolvedValue(undefined);
  reader.recognize.mockResolvedValue({
    data: { text: 'SRI   MURUGAN STORES\n\n\nTomato  1kg    80.00\n' },
  });
  reader.terminate.mockResolvedValue(undefined);
  vi.mocked(createWorker).mockResolvedValue(reader as never);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('reading a photo on this device', () => {
  it('reads it with the app’s own files and settings, tidies the text, and ends the reader', async () => {
    const text = await readOnDevice(PHOTO, 'ta', () => undefined);

    expect(text).toBe('SRI MURUGAN STORES\nTomato 1kg 80.00');
    const { languages, options } = asked();
    expect(languages).toEqual(OCR_LANGUAGES.ta);
    const folder = new URL(env.ocrPath, window.location.href).href;
    expect(options.workerPath).toBe(`${folder}worker.min.js`);
    // The library adds its own slash before a language's file: none of ours.
    expect(options.langPath).toBe(folder.replace(/\/$/, ''));
    expect(options.cachePath).toBe(options.langPath);
    expect(options.workerBlobURL).toBe(false);
    expect(reader.setParameters).toHaveBeenCalledWith({
      tessedit_pageseg_mode: '6',
      preserve_interword_spaces: '1',
    });
    expect(reader.terminate).toHaveBeenCalledOnce();
  });

  it('says how far it has read', async () => {
    const shares: number[] = [];
    vi.mocked(createWorker).mockImplementation((_languages, _oem, options) => {
      options?.logger?.({ status: 'loading language traineddata', progress: 1 } as never);
      options?.logger?.({ status: 'recognizing text', progress: 0.5 } as never);
      return Promise.resolve(reader as never);
    });

    await readOnDevice(PHOTO, 'en', (share) => shares.push(share));

    expect(shares).toEqual([0.5]);
  });

  it('stops when the reader’s files can’t load, which the library only reports aside', async () => {
    vi.mocked(createWorker).mockImplementation(() => new Promise(() => undefined));

    const reading = readOnDevice(PHOTO, 'en', () => undefined);
    await vi.waitFor(() => {
      expect(createWorker).toHaveBeenCalled();
    });
    asked().options.errorHandler(new Error('404 eng.traineddata'));

    await expect(reading).rejects.toBeInstanceOf(ReaderUnavailableError);
  });

  it('never waits longer than it may for the reader to start, and ends one that starts late', async () => {
    let start: (worker: Awaited<ReturnType<typeof createWorker>>) => void = () => undefined;
    vi.mocked(createWorker).mockImplementation(
      () =>
        new Promise((resolve) => {
          start = resolve;
        }),
    );
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    const reading = readOnDevice(PHOTO, 'en', () => undefined);
    const failed = expect(reading).rejects.toThrow(ReaderUnavailableError);
    await vi.waitFor(() => {
      expect(createWorker).toHaveBeenCalled();
    });
    await vi.advanceTimersByTimeAsync(env.scanReadTimeoutMs);
    await failed;
    start(reader as never);
    await vi.waitFor(() => {
      expect(reader.terminate).toHaveBeenCalledOnce();
    });
  });

  it('ends the reader when the reading itself fails', async () => {
    reader.recognize.mockRejectedValue(new Error('out of memory'));

    await expect(readOnDevice(PHOTO, 'en', () => undefined)).rejects.toBeInstanceOf(
      ReaderUnavailableError,
    );
    expect(reader.terminate).toHaveBeenCalledOnce();
  });

  it('says so when the photo can’t be prepared', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        onmessage = null;
        onerror: ((event: { message: string }) => void) | null = null;
        postMessage() {
          queueMicrotask(() => {
            this.onerror?.({ message: '' });
          });
        }
        terminate = vi.fn();
      },
    );

    await expect(readOnDevice(PHOTO, 'en', () => undefined)).rejects.toThrow(
      'The photo could not be prepared.',
    );
    expect(createWorker).not.toHaveBeenCalled();
  });
});

describe('a photo for AI', () => {
  it('is a JPEG of the picture alone, no larger than it may be', async () => {
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      done,
      type,
    ) {
      done(new Blob([`${String(this.width)}x${String(this.height)}`], { type }));
    });

    const shrunk = await shrink(PHOTO);

    expect(shrunk.type).toBe(PHOTO_TYPE);
    const [width, height] = (await shrunk.text()).split('x').map(Number);
    expect(Math.max(width ?? 0, height ?? 0)).toBe(env.scanPhotoPx);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), PHOTO_TYPE, 0.85);
  });

  it('fails when the browser can’t encode it', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((done) => {
      done(null);
    });

    await expect(shrink(PHOTO)).rejects.toThrow('The photo could not be read.');
  });
});
