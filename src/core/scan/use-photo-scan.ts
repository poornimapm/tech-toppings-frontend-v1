import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { agentKeys, useAgents, type AgentRun } from '@/core/agents/queries';
import { api, unwrap } from '@/core/api/client';
import { env } from '@/core/config/env';
import { toLanguage } from '@/core/i18n';
import { PHOTO_TYPE, readOnDevice, shrink } from '@/core/scan/photo-reader';

interface OnDevice {
  on: boolean;
  toggle: () => void;
}

/** Whether this device reads photos itself even with AI on: then only the text read from a
 *  photo (masked like anything typed) may go to AI, never the photo. Remembered here, for every
 *  scan in every module. */
export const useScanOnDevice = create<OnDevice>()(
  persist(
    (set) => ({
      on: false,
      toggle: () => {
        set((state) => ({ on: !state.on }));
      },
    }),
    { name: 'tt-scan-on-device' },
  ),
);

/** Nothing could be read from the photo on this device: nothing to send. */
export class UnreadablePhotoError extends Error {
  constructor() {
    super('No text could be read from the photo.');
    this.name = 'UnreadablePhotoError';
  }
}

/** Where a scan is: sending the photo, reading it here (with how far), or reading the text. */
export type ScanStep = { kind: 'photo' } | { kind: 'device'; share: number } | { kind: 'text' };

/** A photo to read, and whether it may go to AI: decided by what the page said when it was
 *  picked, never later. */
interface Scan {
  photo: Blob;
  toAi: boolean;
}

/** AI read the photo, or said why it couldn't: an answer. Stopped before handing anything over,
 *  it is no answer, and the photo is read here instead. */
const answered = (run: AgentRun) =>
  run.mode === 'agent' && (run.status === 'completed' || run.client_actions.length > 0);

/**
 * Read a photo with a skill that reads photos (`reads: ocr photo` in its SKILL.md). Where the
 * server would hand the photo to AI (the skill's `photo_mode`) and this device doesn't keep
 * photos to itself, the photo goes to AI; if AI can't read it after all, or isn't on, the photo
 * is read here and its text goes through the same skill (its rules without AI). The answer is a
 * run like any other. The photo is only ever held in memory.
 */
export function usePhotoScan(skillName: string) {
  const { i18n } = useTranslation();
  const client = useQueryClient();
  const agents = useAgents();
  const onDevice = useScanOnDevice((state) => state.on);
  const [step, setStep] = useState<ScanStep | null>(null);
  const skill = agents.data
    ?.find((agent) => agent.name === env.assistantAgent)
    ?.skills.find((one) => one.name === skillName);
  const aiOn = skill?.photo_mode === 'agent';

  async function scan({ photo, toAi }: Scan): Promise<AgentRun> {
    const locale = toLanguage(i18n.language);
    const name = { name: env.assistantAgent };
    try {
      if (toAi) {
        setStep({ kind: 'photo' });
        const shrunk = await shrink(photo);
        const run = await unwrap(
          api.POST('/v1/agents/{name}/photo-runs', {
            params: { path: name, query: { skill: skillName, locale } },
            body: shrunk as unknown as string,
            bodySerializer: (body: unknown) => body as Blob,
            headers: { 'Content-Type': PHOTO_TYPE },
          }),
        );
        if (answered(run)) return run;
      }
      setStep({ kind: 'device', share: 0 });
      const text = await readOnDevice(photo, locale, (share) => {
        setStep({ kind: 'device', share });
      });
      if (!text) throw new UnreadablePhotoError();
      setStep({ kind: 'text' });
      return await unwrap(
        api.POST('/v1/agents/{name}/runs', {
          params: { path: name },
          body: { input: text, skill: skillName, locale, context: { input_type: 'ocr' } },
        }),
      );
    } finally {
      setStep(null);
    }
  }

  const mutation = useMutation({
    mutationFn: scan,
    // Offline it must fail at once: a photo is never kept to send later.
    networkMode: 'always',
    // Quota and availability may have changed.
    onSettled: () => client.invalidateQueries({ queryKey: agentKeys.list }),
  });
  return {
    ...mutation,
    step,
    aiOn,
    /** Not known yet whether AI would read photos: no scan until it is, so the page never
     *  says one thing and does another. */
    checking: agents.isPending,
    photosToAi: aiOn && !onDevice,
  };
}
