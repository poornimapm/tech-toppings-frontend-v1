import { onlineManager } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { MODULE_ACTION } from '@/core/agents/queries';
import { shrinkTo } from '@/core/scan/photo-reader';
import type { Day, Payment, Project, Worker } from '@/modules/labor/api';
import {
  errorEnvelope,
  moduleView,
  resetModuleState,
  server,
  testModules,
  tokenFor,
} from '@/test/msw';
import { renderApp } from '@/test/render';

// The camera needs a real browser: its seam is faked (the shrinking has its own tests).
vi.mock('@/core/scan/photo-reader', () => ({
  PHOTO_TYPE: 'image/jpeg',
  shrinkTo: vi.fn(),
  shrink: vi.fn(),
  readOnDevice: vi.fn(),
  ReaderUnavailableError: class ReaderUnavailableError extends Error {},
}));

const NOW = new Date('2026-10-30T06:00:00Z');
const TODAY = '2026-10-30';
const AT = '2026-10-01T10:00:00Z';
const OPTIONS = {
  kinds: ['farm', 'household', 'other'],
  genders: ['female', 'male', 'other'],
  methods: ['cash', 'upi', 'bank', 'other'],
  units: { full: 1, half: 0.5, absent: 0 },
  max_daily_minor: 10_000_000,
  photo_max_bytes: 200_000,
  id_max_bytes: 600_000,
  photo_side_px: 480,
  id_side_px: 1400,
  max_report_days: 400,
};

let projects: Project[];
let workers: Worker[];
let marks: Map<string, { worker_id: string; status: 'full' | 'half' | 'absent' }>;
let payments: Payment[];
let sent: { method: string; path: string; body: unknown; key?: string | null }[];

function project(changes: Partial<Project> = {}): Project {
  return {
    id: 'farm',
    name: 'North farm',
    kind: 'farm',
    description: null,
    icon: '🌱',
    started_on: '2026-10-01',
    notes: null,
    status: 'open',
    closed_at: null,
    currency: 'INR',
    rates: { by_gender: true, default_minor: 40000, female_minor: 45000, male_minor: 50000 },
    created_at: AT,
    updated_at: AT,
    ...changes,
  };
}

function worker(changes: Partial<Worker>): Worker {
  return {
    id: 'w1',
    project_id: 'farm',
    name: 'Lakshmi',
    code: 'W001',
    gender: 'female',
    phone: null,
    daily_wage_minor: 45000,
    active: true,
    notes: null,
    has_photo: false,
    has_id_card: false,
    created_at: AT,
    updated_at: AT,
    ...changes,
  };
}

const pageOf = <T,>(items: T[]) => ({
  items,
  page: 1,
  page_size: 20,
  total: items.length,
  has_next: false,
});

function day(): Day {
  const listed = [...marks.values()].map((mark) => {
    const rate = workers.find((one) => one.id === mark.worker_id)?.daily_wage_minor ?? 0;
    const units = OPTIONS.units[mark.status];
    return { ...mark, units, rate_minor: rate, amount_minor: rate * units, note: null };
  });
  const counted = (status: string) => listed.filter((mark) => mark.status === status).length;
  const active = workers.filter((one) => one.active);
  return {
    day: TODAY,
    workers: active,
    marks: listed,
    counts: {
      full: counted('full'),
      half: counted('half'),
      absent: counted('absent'),
      unmarked: active.length - listed.length,
    },
    total_minor: listed.reduce((sum, mark) => sum + mark.amount_minor, 0),
  };
}

/** The module's routes, against records kept here. */
function fakeApi() {
  const record = async (request: Request) => {
    const url = new URL(request.url);
    const isJson = request.headers.get('Content-Type')?.includes('json');
    sent.push({
      method: request.method,
      path: url.pathname.replace(/^.*\/api/, '') + url.search,
      body: isJson ? await request.json() : await request.text(),
      key: request.headers.get('Idempotency-Key'),
    });
  };
  server.use(
    http.get('*/api/v1/labor/options', () => HttpResponse.json(OPTIONS)),
    http.get('*/api/v1/labor/overview', () =>
      HttpResponse.json({
        day: TODAY,
        open_projects: projects.length,
        workers: workers.length,
        today_minor: day().total_minor,
        owed_minor: 0,
        projects: projects.map((one) => ({
          id: one.id,
          name: one.name,
          icon: one.icon,
          workers: workers.length,
          counts: day().counts,
          today_minor: day().total_minor,
          owed_minor: 0,
        })),
        recent: [],
      }),
    ),
    http.get('*/api/v1/labor/projects', () => HttpResponse.json(pageOf(projects))),
    http.post('*/api/v1/labor/projects', async ({ request }) => {
      await record(request.clone());
      const made = project({ id: 'home', name: ((await request.json()) as { name: string }).name });
      projects = [...projects, made];
      return HttpResponse.json(made, { status: 201 });
    }),
    http.get('*/api/v1/labor/projects/:id', ({ params }) =>
      HttpResponse.json(projects.find((one) => one.id === params.id)),
    ),
    http.post('*/api/v1/labor/projects/:id/close', async ({ params, request }) => {
      await record(request);
      projects = projects.map((one) =>
        one.id === params.id ? { ...one, status: 'closed' as const } : one,
      );
      return HttpResponse.json(projects.find((one) => one.id === params.id));
    }),
    http.get('*/api/v1/labor/projects/:id/workers', () => HttpResponse.json(pageOf(workers))),
    http.post('*/api/v1/labor/projects/:id/workers', async ({ request }) => {
      await record(request.clone());
      const body = (await request.json()) as Partial<Worker>;
      const made = worker({
        ...body,
        id: `w${String(workers.length + 1)}`,
        code: `W00${String(workers.length + 1)}`,
      });
      workers = [...workers, made];
      return HttpResponse.json(made, { status: 201 });
    }),
    http.put('*/api/v1/labor/workers/:id/photo', async ({ params, request }) => {
      await record(request);
      workers = workers.map((one) => (one.id === params.id ? { ...one, has_photo: true } : one));
      return HttpResponse.json(workers.find((one) => one.id === params.id));
    }),
    http.put('*/api/v1/labor/workers/:id/wage', async ({ params, request }) => {
      await record(request.clone());
      const body = (await request.json()) as { daily_wage_minor: number };
      workers = workers.map((one) =>
        one.id === params.id ? { ...one, daily_wage_minor: body.daily_wage_minor } : one,
      );
      return HttpResponse.json(workers.find((one) => one.id === params.id));
    }),
    http.get('*/api/v1/labor/projects/:id/attendance', () => HttpResponse.json(day())),
    http.put('*/api/v1/labor/projects/:id/attendance', async ({ request }) => {
      await record(request.clone());
      const body = (await request.json()) as { marks: { worker_id: string; status: 'full' }[] };
      for (const mark of body.marks) marks.set(mark.worker_id, mark);
      return HttpResponse.json(day());
    }),
    http.get('*/api/v1/labor/projects/:id/payments', () => HttpResponse.json(pageOf(payments))),
    http.post('*/api/v1/labor/projects/:id/payments', async ({ request }) => {
      await record(request.clone());
      const body = (await request.json()) as { worker_id: string; amount_minor: number };
      const made: Payment = {
        id: 'p1',
        worker_id: body.worker_id,
        day: TODAY,
        amount_minor: body.amount_minor,
        method: 'cash',
        reference: null,
        note: null,
        voided_at: null,
        void_reason: null,
        created_at: AT,
      };
      payments = [made, ...payments];
      return HttpResponse.json(made, { status: 201 });
    }),
    http.get('*/api/v1/labor/projects/:id/report', () => HttpResponse.json(report())),
  );
}

/** Three full days each, nothing paid yet. */
function report() {
  const totals = {
    full: 3,
    half: 0,
    absent: 0,
    days: 3,
    earned_minor: 135000,
    paid_minor: 0,
    owed_minor: 135000,
  };
  return {
    start: '2026-10-01',
    end: TODAY,
    grouping: 'week',
    periods: [],
    workers: workers.map((one) => ({
      ...totals,
      worker_id: one.id,
      code: one.code,
      name: one.name,
      earned_to_date_minor: 135000,
      paid_to_date_minor: 0,
      owed_to_date_minor: 135000,
    })),
    total: totals,
  };
}

/** A payment's entry in the audit trail, the worker named by the API. */
const PAID_ENTRY = {
  id: 'a1',
  at: AT,
  actor_name: 'Asha',
  actor_role: 'user',
  project_id: 'farm',
  entity: 'payment',
  entity_id: 'p1',
  action: 'paid',
  changes: [
    { field: 'worker_id', before: null, after: 'w1' },
    { field: 'amount_minor', before: null, after: 10000 },
    { field: 'method', before: null, after: 'upi' },
  ],
  note: 'W001',
  labels: { w1: 'Lakshmi (W001)' },
};

beforeAll(async () => {
  await import('@/modules/labor/labor-layout');
  await import('@/modules/labor/attendance-page');
}, 120_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  projects = [project()];
  workers = [
    worker({}),
    worker({ id: 'w2', name: 'Ravi Kumar', code: 'W002', gender: 'male', daily_wage_minor: 50000 }),
  ];
  marks = new Map();
  payments = [];
  sent = [];
  fakeApi();
  resetModuleState([
    ...testModules.filter((view) => view.key !== 'labor'),
    moduleView('labor', testModules.length, { status: 'beta', available: true }),
  ]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('attendance', () => {
  it('is marked with one tap per worker, and the rest all at once', async () => {
    const { user } = renderApp('/m/labor/attendance?project=farm');
    const lakshmi = await screen.findByRole('group', { name: 'Lakshmi' });

    await user.click(within(lakshmi).getByRole('button', { name: 'Half day' }));
    await waitFor(() => {
      expect(within(lakshmi).getByRole('button', { name: 'Half day' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
    expect(sent.at(-1)).toMatchObject({
      method: 'PUT',
      path: `/v1/labor/projects/farm/attendance?day=${TODAY}`,
      body: { marks: [{ worker_id: 'w1', status: 'half' }] },
    });

    await user.click(screen.getByRole('button', { name: 'Mark the 1 worker left: full day' }));
    await waitFor(() => {
      expect(sent.at(-1)?.body).toEqual({ marks: [{ worker_id: 'w2', status: 'full' }] });
    });
    expect(await screen.findByText('₹725')).toBeInTheDocument(); // ₹225 + ₹500
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderApp('/m/labor/attendance?project=farm');
    await screen.findByRole('group', { name: 'Lakshmi' });

    expect(await axe(container)).toHaveNoViolations();
  });
});

/** The device loses its network: the browser says so, and the query client hears it. */
function goOffline() {
  const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
  return () => {
    online.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
  };
}

describe('attendance with no network', () => {
  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it('keeps each tap on the phone and sends it once back, with the mark it saw', async () => {
    server.use(
      http.put('*/api/v1/labor/projects/:id/attendance', () => HttpResponse.error(), {
        once: true,
      }),
    );
    const { user } = renderApp('/m/labor/attendance?project=farm');
    const lakshmi = await screen.findByRole('group', { name: 'Lakshmi' });
    const backOnline = goOffline();

    await user.click(within(lakshmi).getByRole('button', { name: 'Half day' }));

    expect(await screen.findByText('1 mark is on this phone, waiting to be sent.')).toBeVisible();
    expect(within(lakshmi).getByRole('button', { name: 'Half day' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Waiting to send')).toBeVisible();
    expect(screen.getByText('1 thing you added offline is waiting to be sent.')).toBeVisible();
    expect(sent).toHaveLength(0);

    backOnline();
    expect(await screen.findByText('Sent 1 thing you added offline.')).toBeInTheDocument();
    expect(sent.at(-1)).toMatchObject({
      method: 'PUT',
      path: `/v1/labor/projects/farm/attendance?day=${TODAY}`,
      body: { marks: [{ worker_id: 'w1', status: 'half', expected: 'unmarked' }] },
    });
    await waitFor(() => {
      expect(screen.queryByText(/waiting to be sent/)).toBeNull();
    });
  });

  it('shows a mark changed elsewhere meanwhile as not sent, never overwriting it', async () => {
    const replies = [
      () => HttpResponse.error(),
      () => HttpResponse.json(errorEnvelope('LABOR_MARK_CHANGED', 'Changed'), { status: 409 }),
    ];
    server.use(
      http.put('*/api/v1/labor/projects/:id/attendance', () =>
        (replies.shift() ?? (() => HttpResponse.json(day())))(),
      ),
    );
    const { user } = renderApp('/m/labor/attendance?project=farm');
    const ravi = await screen.findByRole('group', { name: 'Ravi Kumar' });
    const backOnline = goOffline();
    await user.click(within(ravi).getByRole('button', { name: 'Absent' }));
    await screen.findByText('1 mark is on this phone, waiting to be sent.');

    backOnline();

    expect(
      await screen.findByText(/Ravi Kumar · Absent · Oct 30.* wasn't saved: This mark was changed/),
    ).toBeVisible();
  });
});

/** What the owner said, read: Lakshmi full day, someone unknown half day, the rest absent. */
const SAID = {
  status: 'completed',
  mode: 'static',
  reason: null,
  message: null,
  message_code: 'mark-attendance.unsure',
  message_params: { count: 1 },
  draft: {
    project_id: 'farm',
    day: TODAY,
    marks: [
      { worker_id: 'w1', name: 'Lakshmi', status: 'full', uncertain: [] },
      { worker_id: null, name: 'suresh', status: 'half', uncertain: ['worker'] },
    ],
    rest: 'absent',
    uncertain: [],
  },
};

describe('marks said', () => {
  it('are read into a draft to check, and saved only with Save', async () => {
    let asked: unknown = null;
    server.use(
      http.post('*/api/v1/labor/projects/:id/attendance/read', async ({ request }) => {
        asked = await request.json();
        return HttpResponse.json(SAID);
      }),
    );
    const { user } = renderApp('/m/labor/attendance?project=farm');
    await user.click(await screen.findByRole('button', { name: 'Say the marks' }));
    const words = 'Lakshmi full day, Suresh half day, the rest absent';
    await user.type(screen.getByRole('textbox', { name: 'What was said' }), words);
    await user.click(screen.getByRole('button', { name: 'Read the marks' }));

    expect(await screen.findByText('1 to check: who it is, or which mark.')).toBeVisible();
    expect(asked).toEqual({ text: words, input_type: 'text', locale: 'en' });
    expect(screen.getByText('Who is “suresh”?')).toBeVisible();
    expect(screen.getByText('1 worker not named')).toBeVisible(); // Ravi Kumar, by "the rest"
    expect(sent).toHaveLength(0); // read, not saved
    // Who "suresh" is: anyone but Lakshmi, who has a row of her own.
    const who = screen.getByRole('combobox', { name: 'Worker' });
    expect(who).toHaveAccessibleDescription('Who is “suresh”?');
    expect(within(who).queryByRole('option', { name: 'Lakshmi (W001)' })).toBeNull();
    expect(within(who).getByRole('option', { name: 'Ravi Kumar (W002)' })).toBeInTheDocument();

    // Nobody here is Suresh: left out. Lakshmi full day, and the rest (Ravi Kumar) absent.
    await user.click(screen.getByRole('button', { name: 'Save 2 marks' }));

    expect(await screen.findByText('Saved 2 marks.')).toBeInTheDocument();
    expect(sent.at(-1)?.body).toEqual({
      marks: [
        { worker_id: 'w1', status: 'full' },
        { worker_id: 'w2', status: 'absent' },
      ],
    });
  });

  it('can be a draft the assistant read elsewhere and handed over', async () => {
    const { router } = renderApp('/m/labor/attendance?project=farm');
    await screen.findByRole('group', { name: 'Lakshmi' });

    await act(() =>
      router.navigate('/m/labor/attendance', {
        state: {
          [MODULE_ACTION]: {
            tool: 'labor_attendance_draft',
            arguments: {
              draft: {
                project_id: 'farm',
                day: TODAY,
                marks: [{ worker_id: 'w2', name: 'Ravi Kumar', status: 'half', uncertain: [] }],
              },
            },
          },
        },
      }),
    );

    expect(await screen.findByRole('button', { name: 'Save 1 mark' })).toBeVisible();
    // Taken once: the history entry forgets it, and keeps the draft's project.
    expect(router.state.location.state).toBeNull();
    expect(router.state.location.search).toBe('?project=farm');
  });
});

describe('workers', () => {
  it('are added with the project’s usual wage for their gender, and their photo', async () => {
    vi.mocked(shrinkTo).mockResolvedValue(new Blob(['SMALL'], { type: 'image/jpeg' }));
    const { user } = renderApp('/m/labor/workers?project=farm');
    await user.click(await screen.findByRole('button', { name: 'Add a worker' }));
    const dialog = await screen.findByRole('dialog', { name: 'New worker' });

    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Meena');
    await user.click(within(dialog).getByRole('radio', { name: 'Woman' }));
    expect(within(dialog).getByRole('textbox', { name: /Daily wage/ })).toHaveValue('450.00');
    fireEvent.change(within(dialog).getByLabelText("Worker's photo"), {
      target: { files: [new File(['RAW'], 'face.jpg', { type: 'image/jpeg' })] },
    });
    await within(dialog).findByRole('img', { name: 'Photo of the worker' });
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Added Meena (W003).')).toBeInTheDocument();
    expect(sent.map((call) => `${call.method} ${call.path}`)).toEqual([
      'POST /v1/labor/projects/farm/workers',
      'PUT /v1/labor/workers/w3/photo',
    ]);
    expect(sent[0]?.body).toMatchObject({
      name: 'Meena',
      gender: 'female',
      daily_wage_minor: 45000,
    });
    expect(vi.mocked(shrinkTo)).toHaveBeenCalledWith(expect.any(File), 480, 200_000);
  });
});

describe('a worker’s history', () => {
  it('shows their days of the last month and their payments, voided ones marked', async () => {
    let asked = '';
    server.use(
      http.get('*/api/v1/labor/workers/:id/history', ({ request }) => {
        asked = new URL(request.url).search;
        return HttpResponse.json({
          worker: workers[0],
          start: '2026-10-01',
          end: TODAY,
          days: [
            {
              day: TODAY,
              worker_id: 'w1',
              status: 'half',
              units: 0.5,
              rate_minor: 45000,
              amount_minor: 22500,
              note: null,
            },
          ],
          payments: [
            {
              id: 'p9',
              worker_id: 'w1',
              day: TODAY,
              amount_minor: 10000,
              method: 'cash',
              reference: null,
              note: null,
              voided_at: AT,
              void_reason: 'Typed wrong',
              created_at: AT,
            },
          ],
          earned_minor: 22500,
          paid_minor: 0,
        });
      }),
    );
    const { user } = renderApp('/m/labor/workers?project=farm');
    await user.click(await screen.findByRole('button', { name: 'Days and payments of Lakshmi' }));
    const dialog = await screen.findByRole('dialog', { name: 'Lakshmi: days and payments' });

    expect(await within(dialog).findByText('Half day')).toBeInTheDocument();
    expect(within(dialog).getByText('Voided')).toBeInTheDocument();
    expect(within(dialog).getByText(/^Earned /)).toHaveTextContent(/Earned ₹225(\.00)? · Paid ₹0/);
    expect(asked).toBe('?from=2026-10-01&to=2026-10-30');
  });
});

describe('wages', () => {
  it('change from a day on, with the reason', async () => {
    const { user } = renderApp('/m/labor/wages?project=farm');
    const list = await screen.findByRole('list', { name: "Each worker's wage" });
    // Each row's button is named with its worker too.
    await user.click(within(list).getByRole('button', { name: 'Change wage Lakshmi' }));
    const dialog = await screen.findByRole('dialog', { name: 'New wage for Lakshmi' });

    const amount = within(dialog).getByRole('textbox', { name: /New daily wage/ });
    await user.clear(amount);
    await user.type(amount, '500');
    await user.type(within(dialog).getByRole('textbox', { name: /Why/ }), 'Harvest');
    await user.click(within(dialog).getByRole('button', { name: 'Save wage' }));

    expect(await screen.findByText('Lakshmi now earns ₹500 a day.')).toBeInTheDocument();
    expect(sent.at(-1)).toMatchObject({
      method: 'PUT',
      path: '/v1/labor/workers/w1/wage',
      body: { daily_wage_minor: 50000, effective_on: TODAY, reason: 'Harvest' },
    });
  });
});

describe('payments', () => {
  it('are kept apart from what was earned, and sent once whatever the taps', async () => {
    const { user } = renderApp('/m/labor/payments?project=farm');
    const balances = await screen.findByRole('list', { name: 'What is owed' });
    expect(within(balances).getAllByText('Owed ₹1,350')).toHaveLength(2);
    // Earned and paid to date, so they add up to what is owed.
    expect(within(balances).getAllByText('Earned ₹1,350 · Paid ₹0')).toHaveLength(2);

    await user.click(within(balances).getByRole('button', { name: 'Pay Lakshmi' }));
    const dialog = await screen.findByRole('dialog', { name: 'Pay Lakshmi' });
    expect(within(dialog).getByRole('textbox', { name: /Amount/ })).toHaveValue('1350.00');
    await user.click(within(dialog).getByRole('radio', { name: 'UPI' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save payment' }));

    expect(await screen.findByText('Paid ₹1,350 to Lakshmi.')).toBeInTheDocument();
    const [payment] = sent;
    expect(payment?.body).toMatchObject({ worker_id: 'w1', amount_minor: 135000, method: 'upi' });
    expect(payment?.key).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('projects', () => {
  it('close only after asking, keeping everything', async () => {
    const { user } = renderApp('/m/labor/projects');
    await user.click(await screen.findByRole('button', { name: 'Close project' }));
    const dialog = await screen.findByRole('dialog', { name: 'Close “North farm”?' });
    expect(within(dialog).getByRole('button', { name: 'Keep it open' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: 'Close project' }));

    expect(await screen.findByText('Closed “North farm”.')).toBeInTheDocument();
    expect(sent.at(-1)).toMatchObject({ method: 'POST', path: '/v1/labor/projects/farm/close' });
  });
});

describe('every worker', () => {
  it('is listed to be paid, however many pages they take', async () => {
    const asked: string[] = [];
    server.use(
      http.get('*/api/v1/labor/projects/:id/workers', ({ request }) => {
        const query = new URL(request.url).searchParams;
        asked.push(query.toString());
        const page = Number(query.get('page'));
        return HttpResponse.json({
          items: workers.slice(page - 1, page),
          page,
          page_size: 1,
          total: workers.length,
          has_next: page < workers.length,
        });
      }),
    );
    renderApp('/m/labor/payments?project=farm');
    const balances = await screen.findByRole('list', { name: 'What is owed' });

    expect(await within(balances).findByRole('button', { name: 'Pay Ravi Kumar' })).toBeVisible();
    expect(within(balances).getByRole('button', { name: 'Pay Lakshmi' })).toBeVisible();
    expect(asked).toEqual(['page=1&page_size=100', 'page=2&page_size=100']);
  });

  it('is named in a report by the report itself', async () => {
    renderApp('/m/labor/reports?project=farm');
    const table = await screen.findByRole('table', { name: 'By worker' });

    expect(within(table).getByText('Ravi Kumar (W002)')).toBeInTheDocument();
    // What is owed runs to the report's last day: said so, the total matching the workers'.
    expect(
      within(table).getByRole('columnheader', { name: 'Owed up to Oct 30, 2026' }),
    ).toBeVisible();
    expect(screen.getByText('₹2,700')).toBeVisible(); // ₹1,350 each
  });
});

describe('a report', () => {
  it('prints, and downloads as a file under the name the server gives it', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const saved: string[] = [];
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:report');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      saved.push(this.download);
    });
    const name = 'labor-report-2026-10-01-to-2026-10-30.csv';
    let asked = '';
    server.use(
      http.get('*/api/v1/labor/projects/:id/report.csv', ({ request }) => {
        asked = new URL(request.url).search;
        return new HttpResponse('﻿section,start\r\n', {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${name}"`,
          },
        });
      }),
    );
    const { user } = renderApp('/m/labor/reports?project=farm&from=2026-10-01');

    await user.click(await screen.findByRole('button', { name: 'Print or save as PDF' }));
    await user.click(screen.getByRole('button', { name: 'Download CSV' }));

    expect(print).toHaveBeenCalledOnce();
    expect(await screen.findByText(`Downloaded ${name}.`)).toBeInTheDocument();
    expect(saved).toEqual([name]);
    expect(asked).toBe('?from=2026-10-01&to=2026-10-30&group=day');
  });

  it('says why a file was refused', async () => {
    server.use(
      http.get('*/api/v1/labor/projects/:id/report.csv', () =>
        HttpResponse.json(errorEnvelope('LABOR_EXPORT_TOO_LARGE', 'Too many', { max: 20000 }), {
          status: 422,
        }),
      ),
    );
    const { user } = renderApp('/m/labor/reports?project=farm');

    await user.click(await screen.findByRole('button', { name: 'Download CSV' }));

    expect(
      await screen.findByText(
        "That's more days and payments than one file takes. Choose a shorter period.",
      ),
    ).toBeInTheDocument();
  });
});

describe('the history', () => {
  it('says whom a payment paid by name, not by an id', async () => {
    const stopped = {
      ...PAID_ENTRY,
      id: 'a2',
      entity: 'worker',
      entity_id: 'w2',
      action: 'deactivated',
      changes: [{ field: 'active', before: true, after: false }],
      note: null,
      labels: { w2: 'Ravi Kumar (W002)' },
    };
    server.use(
      http.get('*/api/v1/labor/audit', () => HttpResponse.json(pageOf([PAID_ENTRY, stopped]))),
    );
    renderApp('/m/labor/audit?project=farm');
    // An entry about a worker says whom.
    expect(await screen.findByText(/· Ravi Kumar \(W002\)$/)).toBeVisible();

    expect(await screen.findByText('Worker: nothing → Lakshmi (W001)')).toBeInTheDocument();
    expect(screen.getByText('Amount: nothing → ₹100')).toBeInTheDocument();
    expect(screen.getByText('How: nothing → UPI')).toBeInTheDocument();
  });
});

describe('the admin', () => {
  it('opens a project to read, and sees each change from and to', async () => {
    server.use(
      http.post('*/api/v1/auth/refresh', () => HttpResponse.json(tokenFor({ role: 'admin' }))),
      http.get('*/api/v1/admin/labor/owners', () =>
        HttpResponse.json([
          {
            id: 'o1',
            name: 'Kavya',
            email: 'kavya@example.com',
            active: true,
            open_projects: 1,
            projects: 1,
            workers: 2,
          },
        ]),
      ),
      http.get('*/api/v1/admin/labor/projects', () =>
        HttpResponse.json(pageOf([{ ...project(), owner_id: 'o1', owner_name: 'Kavya' }])),
      ),
      http.get('*/api/v1/admin/labor/projects/:id/workers', () =>
        HttpResponse.json(pageOf(workers.map((one, at) => ({ ...one, has_id_card: at === 0 })))),
      ),
      http.get('*/api/v1/admin/labor/projects/:id/report', () => HttpResponse.json(report())),
      http.get('*/api/v1/admin/labor/audit', () => HttpResponse.json(pageOf([PAID_ENTRY]))),
    );
    const { user, container } = renderApp('/m/labor/all');

    await user.click(await screen.findByRole('button', { name: 'North farm' }));
    const details = await screen.findByRole('region', { name: 'North farm, run by Kavya' });
    expect(
      within(details).getByRole('heading', { name: 'North farm, run by Kavya' }),
    ).toHaveFocus();
    const listed = await within(details).findByRole('table', { name: 'Workers: North farm' });
    expect(within(listed).getByText('Lakshmi (W001)')).toBeInTheDocument();
    expect(await within(details).findByRole('table', { name: 'By worker' })).toBeInTheDocument();
    expect(screen.getByText('Worker: nothing → Lakshmi (W001)')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
