import { ScanLine } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { AgentRun } from '@/core/agents/queries';
import { ApiError } from '@/core/api/api-error';
import { errorKey } from '@/core/i18n';
import { isOffline } from '@/core/offline/outbox';
import { SCAN_NS } from '@/core/scan/i18n';
import { ReaderUnavailableError } from '@/core/scan/photo-reader';
import { UnreadablePhotoError, usePhotoScan, useScanOnDevice } from '@/core/scan/use-photo-scan';
import { Button } from '@/design-system';

/** A module's words for its scan: what it reads ("a receipt", "a bill"). */
export interface ScanTexts {
  button: string;
  /** The file picker's name. */
  pick: string;
  /** While the photo, or the text read from it, is being read. */
  sending: string;
  /** While the photo is read on this device. */
  reading: string;
  /** The progress bar's name. */
  progress: string;
  /** Nothing of its kind could be read in the photo. */
  unreadable: string;
}

/**
 * Scan a photo with a skill: from the camera or the gallery (the system's own picker, so no
 * camera permission). Where the photo goes is said beside the button, and this device can keep
 * photos to itself. What the scan hands over is the module's (`onRead`).
 */
export function ScanPhoto({
  skill,
  texts,
  describe,
  onRead,
}: {
  skill: string;
  texts: ScanTexts;
  /** What a run that handed something over says, in the module's words (null: nothing). */
  describe?: (run: AgentRun) => string | null;
  onRead: (run: AgentRun) => void;
}) {
  const { t } = useTranslation(SCAN_NS);
  const { t: tError } = useTranslation('errors');
  const picker = useRef<HTMLInputElement>(null);
  const scanner = usePhotoScan(skill);
  const onDevice = useScanOnDevice();
  const { data: run, error, step } = scanner;

  async function scan(photo: File) {
    // Where it goes is what the note said as it was picked.
    const answer = await scanner.mutateAsync({ photo, toAi: scanner.photosToAi }).catch(() => null);
    if (answer) onRead(answer);
  }

  // The live line says what is happening; how far the reading is shows in the bar below, which
  // a screen reader can be asked about rather than told every percent.
  let status: ReactNode = null;
  if (step?.kind === 'photo' || step?.kind === 'text') status = texts.sending;
  else if (step?.kind === 'device' && step.share === 0) status = t('preparing');
  else if (step?.kind === 'device') status = texts.reading;
  else if (error instanceof UnreadablePhotoError) status = texts.unreadable;
  else if (error && (isOffline(error) || !navigator.onLine)) status = t('offline');
  else if (error instanceof ReaderUnavailableError) status = t('readerFailed');
  else if (error instanceof ApiError) status = tError(errorKey(error.code));
  else if (error)
    status = t('cantOpen'); // not a picture this browser can open
  else if (run?.message) status = run.message;
  else if (run) status = describe?.(run) ?? texts.unreadable;

  const where = scanner.photosToAi ? 'toAi' : 'local';
  const note = scanner.checking ? 'checking' : where;

  return (
    <div className="space-y-1 px-1 pt-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <input
          ref={picker}
          type="file"
          accept="image/*"
          hidden
          aria-label={texts.pick}
          onChange={(event) => {
            const photo = event.target.files?.[0];
            event.target.value = ''; // the same photo can be picked again
            if (photo && !scanner.checking) void scan(photo); // the button waits for that too
          }}
        />
        <Button
          variant="secondary"
          className="rounded-full"
          disabled={scanner.isPending || scanner.checking}
          onClick={() => picker.current?.click()}
        >
          <ScanLine aria-hidden="true" className="size-4" />
          {texts.button}
        </Button>
        {scanner.aiOn && (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={onDevice.on} onChange={onDevice.toggle} />
            {t('onDevice')}
          </label>
        )}
      </div>
      <p className="text-xs text-muted">{t(note)}</p>
      <p role="status" className="min-h-5 text-sm text-muted">
        {status}
      </p>
      {step?.kind === 'device' && step.share > 0 && (
        <progress
          className="h-1.5 w-full accent-primary"
          max={1}
          value={step.share}
          aria-label={texts.progress}
        />
      )}
    </div>
  );
}
