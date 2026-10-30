import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { ApiError, isTransient } from '@/core/api/api-error';
import { api, unwrap } from '@/core/api/client';
import { saveFile } from '@/core/api/save-file';
import type { components } from '@/core/api/schema';
import { usePages } from '@/core/api/use-pages';
import { userKeys } from '@/core/auth/queries';
import { useSession } from '@/core/auth/session-store';
import i18n, { errorKey } from '@/core/i18n';
import { discard, enqueue, useOutbox } from '@/core/offline/outbox';
import { displayDate } from '@/core/utils/dates';
import { toast } from '@/design-system';
import { NS } from '@/modules/labor/i18n';
import { OUTBOX_MARKS, type MarksLater } from '@/modules/labor/outbox-kinds';

type Schemas = components['schemas'];
export type Project = Schemas['LaborProjectOut'];
export type ProjectInput = Schemas['ProjectIn'];
export type RatesInput = Schemas['RatesIn'];
export type Worker = Schemas['LaborWorkerOut'];
export type WorkerInput = Schemas['WorkerIn'];
export type WageInput = Schemas['WageIn'];
export type Day = Schemas['LaborDayOut'];
export type Mark = Schemas['LaborMarkOut'];
export type MarkStatus = Schemas['AttendanceStatus'];
export type Payment = Schemas['LaborPaymentOut'];
export type PaymentInput = Schemas['PaymentIn'];
export type Report = Schemas['LaborReportOut'];
export type AuditEntry = Schemas['LaborAuditOut'];
export type Options = Schemas['LaborOptions'];
export type Overview = Schemas['OverviewOut'];
export type Picture = 'photo' | 'id_card';

const laborKey = [...userKeys.all, 'labor'] as const;
export const laborKeys = {
  all: laborKey,
  options: [...laborKey, 'options'] as const,
  overview: [...laborKey, 'overview'] as const,
  projects: (filters: object) => [...laborKey, 'projects', filters] as const,
  project: (id: string) => [...laborKey, 'project', id] as const,
  workers: (project: string, filters: object) =>
    [...laborKey, 'workers', project, filters] as const,
  worker: (project: string, id: string) => [...laborKey, 'worker', project, id] as const,
  wages: (project: string, id: string) => [...laborKey, 'wages', project, id] as const,
  history: (project: string, id: string, from: string, to: string) =>
    [...laborKey, 'history', project, id, from, to] as const,
  day: (project: string, day: string) => [...laborKey, 'day', project, day] as const,
  payments: (project: string, filters: object) =>
    [...laborKey, 'payments', project, filters] as const,
  report: (project: string, filters: object) => [...laborKey, 'report', project, filters] as const,
  audit: (filters: object) => [...laborKey, 'audit', filters] as const,
  picture: (project: string, id: string, which: Picture, version: string) =>
    [...laborKey, 'picture', project, id, which, version] as const,
};

const path = (project_id: string) => ({ params: { path: { project_id } } });
const workerPath = (worker_id: string) => ({ params: { path: { worker_id } } });

/** A failure's code, for a form to say what went wrong. */
export function failureCode(error: unknown): string | null {
  if (!error) return null;
  return error instanceof ApiError ? error.code : 'UNKNOWN';
}

function sayWhyNot(error: unknown) {
  toast(i18n.t(errorKey(failureCode(error) ?? 'UNKNOWN'), { ns: 'errors' }), { tone: 'danger' });
}

/** A change: everything of the module's is fresh after it (the overview, the reports and the
 *  audit trail move with every change). Not awaited, so a page can leave at once. */
function useChange<TInput, TResult>(
  run: (input: TInput) => Promise<TResult>,
  { toastErrors = false }: { toastErrors?: boolean } = {},
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: laborKeys.all });
    },
    onError: toastErrors ? sayWhyNot : undefined,
  });
}

export function useOptions() {
  return useQuery({
    queryKey: laborKeys.options,
    queryFn: () => unwrap(api.GET('/v1/labor/options')),
    staleTime: Infinity,
  });
}

export function useOverview() {
  return useQuery({
    queryKey: laborKeys.overview,
    queryFn: () => unwrap(api.GET('/v1/labor/overview')),
  });
}

export function useProjects(filters: { state?: Project['status']; q?: string } = {}) {
  return usePages(laborKeys.projects(filters), (page) =>
    unwrap(api.GET('/v1/labor/projects', { params: { query: { page, ...filters } } })),
  );
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: laborKeys.project(id ?? ''),
    queryFn: () => unwrap(api.GET('/v1/labor/projects/{project_id}', path(id ?? ''))),
    enabled: id !== null,
  });
}

export function useSaveProject() {
  return useChange(({ id, body }: { id?: string; body: ProjectInput }) =>
    unwrap(
      id
        ? api.PATCH('/v1/labor/projects/{project_id}', { ...path(id), body })
        : api.POST('/v1/labor/projects', { body }),
    ),
  );
}

export function useProjectStatus() {
  return useChange(
    ({ id, open, note }: { id: string; open: boolean; note?: string }) =>
      unwrap(
        open
          ? api.POST('/v1/labor/projects/{project_id}/reopen', { ...path(id), body: { note } })
          : api.POST('/v1/labor/projects/{project_id}/close', { ...path(id), body: { note } }),
      ),
    { toastErrors: true },
  );
}

export function useSetRates() {
  return useChange(({ id, body }: { id: string; body: RatesInput }) =>
    unwrap(api.PUT('/v1/labor/projects/{project_id}/rates', { ...path(id), body })),
  );
}

export function useWorkers(project: string | null, filters: { active?: boolean; q?: string } = {}) {
  return usePages(laborKeys.workers(project ?? '', filters), (page) =>
    unwrap(
      api.GET('/v1/labor/projects/{project_id}/workers', {
        params: { path: { project_id: project ?? '' }, query: { page, ...filters } },
      }),
    ),
  );
}

/** The most a page brings back (the API's largest page): a project's workers in a few. */
export const WHOLE_PAGE = 100;

/** Every item of a paged list, page after page: for lists bounded small (a project's workers,
 *  a few hundred at most). */
export async function everyPage<T>(
  fetchPage: (page: number) => Promise<{ items: T[]; has_next: boolean }>,
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; ; page += 1) {
    const found = await fetchPage(page);
    all.push(...found.items);
    if (!found.has_next) return all;
  }
}

/** Every worker of a project, for a page that lists them all (to pay, or to change a wage). */
export function useAllWorkers(project: string | null, filters: { active?: boolean } = {}) {
  return useQuery({
    queryKey: [...laborKeys.workers(project ?? '', filters), 'all'],
    queryFn: () =>
      everyPage((page) =>
        unwrap(
          api.GET('/v1/labor/projects/{project_id}/workers', {
            params: {
              path: { project_id: project ?? '' },
              query: { page, page_size: WHOLE_PAGE, ...filters },
            },
          }),
        ),
      ),
    enabled: project !== null,
  });
}

export function useSaveWorker(project: string) {
  return useChange(({ id, body }: { id?: string; body: WorkerInput }) =>
    unwrap(
      id
        ? api.PATCH('/v1/labor/workers/{worker_id}', { ...workerPath(id), body })
        : api.POST('/v1/labor/projects/{project_id}/workers', { ...path(project), body }),
    ),
  );
}

export function useSetActive() {
  return useChange(
    ({ id, active }: { id: string; active: boolean }) =>
      unwrap(
        api.PUT('/v1/labor/workers/{worker_id}/active', { ...workerPath(id), body: { active } }),
      ),
    { toastErrors: true },
  );
}

export function useSetWage() {
  return useChange(({ id, body }: { id: string; body: WageInput }) =>
    unwrap(api.PUT('/v1/labor/workers/{worker_id}/wage', { ...workerPath(id), body })),
  );
}

export function useWages(project: string, worker: string | null) {
  return useQuery({
    queryKey: laborKeys.wages(project, worker ?? ''),
    queryFn: () => unwrap(api.GET('/v1/labor/workers/{worker_id}/wages', workerPath(worker ?? ''))),
    enabled: worker !== null,
  });
}

/** A worker's days and payments between two days, newest first. */
export function useWorkerHistory(project: string, worker: string, from: string, to: string) {
  return useQuery({
    queryKey: laborKeys.history(project, worker, from, to),
    queryFn: () =>
      unwrap(
        api.GET('/v1/labor/workers/{worker_id}/history', {
          params: { path: { worker_id: worker }, query: { from, to } },
        }),
      ),
  });
}

/** A worker's photo or ID picture, kept only by the caller's browser for as long as it is
 *  shown: fetched with the signed-in session (it is private), then shown from memory. */
export function usePicture(project: string, worker: Worker, which: Picture) {
  const has = which === 'photo' ? worker.has_photo : worker.has_id_card;
  const blob = useQuery({
    queryKey: laborKeys.picture(project, worker.id, which, worker.updated_at),
    queryFn: () =>
      unwrap(
        which === 'photo'
          ? api.GET('/v1/labor/workers/{worker_id}/photo', {
              ...workerPath(worker.id),
              parseAs: 'blob',
            })
          : api.GET('/v1/labor/workers/{worker_id}/id-card', {
              ...workerPath(worker.id),
              parseAs: 'blob',
            }),
      ),
    enabled: has,
    staleTime: Infinity,
  });
  const url = useMemo(() => (blob.data ? URL.createObjectURL(blob.data) : null), [blob.data]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return has ? url : null;
}

export function usePutPicture() {
  return useChange(
    ({ id, which, photo }: { id: string; which: Picture; photo: Blob }) => {
      const upload = {
        ...workerPath(id),
        body: photo as unknown as string,
        bodySerializer: (body: unknown) => body as Blob,
        headers: { 'Content-Type': photo.type },
      };
      return unwrap(
        which === 'photo'
          ? api.PUT('/v1/labor/workers/{worker_id}/photo', upload)
          : api.PUT('/v1/labor/workers/{worker_id}/id-card', upload),
      );
    },
    { toastErrors: true },
  );
}

/** How long a day's sheet stays in memory unseen: one opened online can still be marked when
 *  the network drops later in the day (the marks then wait in the outbox). */
const KEEP_DAY_MS = 12 * 60 * 60 * 1000;

export function useDay(project: string | null, day: string) {
  return useQuery({
    gcTime: KEEP_DAY_MS,
    queryKey: laborKeys.day(project ?? '', day),
    queryFn: () =>
      unwrap(
        api.GET('/v1/labor/projects/{project_id}/attendance', {
          params: { path: { project_id: project ?? '' }, query: { day } },
        }),
      ),
    enabled: project !== null,
  });
}

/** A tap on a worker's card: the mark, the one the owner saw, and words for it if it has to
 *  wait (the device's outbox shows them). */
export interface Tap {
  worker_id: string;
  status: MarkStatus;
  expected: MarkStatus | 'unmarked';
  label: string;
}

/** The marks waiting on this device for a project's day, by worker (the latest tap wins). */
function useWaitingMarks(project: string, day: string): Map<string, MarkStatus> {
  const owner = useSession((state) => state.user?.id);
  const items = useOutbox((state) => state.items);
  const waiting = new Map<string, MarkStatus>();
  for (const item of items) {
    if (item.owner !== owner || item.kind !== OUTBOX_MARKS || item.failure) continue;
    const later = item.payload as MarksLater;
    if (later.project_id !== project || later.day !== day) continue;
    for (const mark of later.marks) waiting.set(mark.worker_id, mark.status);
  }
  return waiting;
}

/** A day's marks as the owner sees them (a tap still waiting on this device, else what is
 *  saved), and taps made from them: each says the mark seen, with words for the outbox. */
export function useTaps(project: string, day: string, sheet: Day) {
  const waiting = useWaitingMarks(project, day);
  const saved = new Map(sheet.marks.map((mark) => [mark.worker_id, mark.status]));
  const shown = (worker: string) => waiting.get(worker) ?? saved.get(worker) ?? null;
  const when = displayDate(day).toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'short',
  });
  const tap = (worker: Worker, status: MarkStatus): Tap => ({
    worker_id: worker.id,
    status,
    expected: shown(worker.id) ?? 'unmarked',
    label: `${worker.name} · ${i18n.t(`mark.${status}`, { ns: NS })} · ${when}`,
  });
  return { waiting, shown, tap };
}

/** Marks for a day, saved as they are tapped; the day's sheet comes back whole. With no
 *  network (or the server out of reach) each tap waits on the device, one by one (one refused
 *  never holds back the rest), and goes when it can; the answer is then null. */
export function useMark(project: string, day: string) {
  const client = useQueryClient();
  const owner = useSession((state) => state.user?.id);
  return useMutation({
    // Tried even with no network, so the tap is kept at once rather than paused unseen.
    networkMode: 'always',
    mutationFn: async (tapped: Tap[]) => {
      // One mark a worker: the last one tapped (two for one worker would refuse each other).
      const taps = [...new Map(tapped.map((tap) => [tap.worker_id, tap])).values()];
      try {
        return await unwrap(
          api.PUT('/v1/labor/projects/{project_id}/attendance', {
            params: { path: { project_id: project }, query: { day } },
            body: { marks: taps.map(({ worker_id, status }) => ({ worker_id, status })) },
          }),
        );
      } catch (error) {
        // No network, or the server out of reach (a gateway's 502-504): kept on the device. The
        // mark is safe to send again: it says the mark it saw.
        if (!isTransient(error) || !owner) throw error;
        for (const { worker_id, status, expected, label } of taps) {
          const payload: MarksLater = {
            project_id: project,
            day,
            marks: [{ worker_id, status, expected }],
          };
          await enqueue({ id: crypto.randomUUID(), kind: OUTBOX_MARKS, owner, label, payload });
        }
        return null;
      }
    },
    // When it was sent: only taps kept before it are overtaken by it.
    onMutate: () => ({ sentAt: new Date().toISOString() }),
    onSuccess: async (sheet, taps, context) => {
      if (!sheet) return;
      client.setQueryData(laborKeys.day(project, day), sheet);
      void client.invalidateQueries({ queryKey: laborKeys.all });
      // A tap saved now overtakes the ones still waiting for the same worker and day.
      const tapped = new Set(taps.map((tap) => tap.worker_id));
      const overtaken = useOutbox.getState().items.filter((item) => {
        const later = item.payload as MarksLater;
        return (
          item.owner === owner &&
          item.kind === OUTBOX_MARKS &&
          item.queuedAt < context.sentAt &&
          later.project_id === project &&
          later.day === day &&
          later.marks.every((mark) => tapped.has(mark.worker_id))
        );
      });
      for (const item of overtaken) await discard(item.id);
    },
    onError: (error) => {
      sayWhyNot(error);
      // Refused (a worker stopped, the project closed elsewhere): the day as it is now, so the
      // same marks aren't sent again in vain.
      if (error instanceof ApiError && !isTransient(error)) {
        void client.invalidateQueries({ queryKey: laborKeys.day(project, day) });
        void client.invalidateQueries({ queryKey: laborKeys.project(project) });
      }
    },
  });
}

/** Marks said or typed, read into a draft for the page to show (the mark-attendance skill, by
 *  the rules or the AI). Nothing is saved: the owner saves the draft with `useMark`. */
export function useReadMarks(project: string, day: string) {
  return useMutation({
    networkMode: 'always',
    mutationFn: (body: Schemas['ReadMarksIn']) =>
      unwrap(
        api.POST('/v1/labor/projects/{project_id}/attendance/read', {
          params: { path: { project_id: project }, query: { day } },
          body,
        }),
      ),
  });
}

export function usePayments(project: string | null, filters: { worker_id?: string } = {}) {
  return usePages(laborKeys.payments(project ?? '', filters), (page) =>
    unwrap(
      api.GET('/v1/labor/projects/{project_id}/payments', {
        params: { path: { project_id: project ?? '' }, query: { page, ...filters } },
      }),
    ),
  );
}

/** A payment, sent with one key however often it is tried (a double tap pays once). */
export function useAddPayment(project: string) {
  return useChange(({ body, key }: { body: PaymentInput; key: string }) =>
    unwrap(
      api.POST('/v1/labor/projects/{project_id}/payments', {
        ...path(project),
        body,
        headers: { 'Idempotency-Key': key },
      }),
    ),
  );
}

export function useVoidPayment() {
  return useChange(
    ({ id, reason }: { id: string; reason: string }) =>
      unwrap(
        api.POST('/v1/labor/payments/{payment_id}/void', {
          params: { path: { payment_id: id } },
          body: { reason },
        }),
      ),
    { toastErrors: true },
  );
}

export interface ReportFilters {
  from: string;
  to: string;
  group: 'day' | 'week' | 'month';
}

export function useReport(project: string | null, filters: ReportFilters) {
  return useQuery({
    queryKey: laborKeys.report(project ?? '', filters),
    queryFn: () =>
      unwrap(
        api.GET('/v1/labor/projects/{project_id}/report', {
          params: { path: { project_id: project ?? '' }, query: filters },
        }),
      ),
    enabled: project !== null,
  });
}

/** The report as a CSV file (the figures, then each day marked and each payment), saved by the
 *  browser under the name the server gave it; the admin's copy of any owner's when `admin`. */
export function useSaveReportFile(project: string | null, { admin = false } = {}) {
  return useMutation({
    mutationFn: (filters: ReportFilters) => {
      const options = {
        params: { path: { project_id: project ?? '' }, query: filters },
        parseAs: 'blob' as const,
      };
      return saveFile(
        admin
          ? api.GET('/v1/admin/labor/projects/{project_id}/report.csv', options)
          : api.GET('/v1/labor/projects/{project_id}/report.csv', options),
        'labor-report.csv',
      );
    },
  });
}

export interface AuditFilters {
  project_id?: string;
  entity?: string;
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
}

export function useAudit(filters: AuditFilters) {
  return usePages(laborKeys.audit(filters), (page) =>
    unwrap(api.GET('/v1/labor/audit', { params: { query: { page, ...filters } } })),
  );
}
