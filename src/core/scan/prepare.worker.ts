import { prepare, type Grey } from '@/core/scan/photo-image';

/** A photo's pixels, as a canvas gives them. */
export interface PrepareJob {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
}

// Runs in a worker of its own: preparing a phone photo takes seconds on a phone, and the page
// (its progress line, its buttons) must stay alive meanwhile. The pixels travel both ways
// without being copied.
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<PrepareJob>) => void) | null;
  postMessage: (ready: Grey, transfer: Transferable[]) => void;
};

scope.onmessage = ({ data }) => {
  const ready = prepare(data.rgba, data.width, data.height);
  scope.postMessage(ready, [ready.pixels.buffer]);
};
