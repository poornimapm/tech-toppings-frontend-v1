import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import type { AgentRun, ClientAction } from '@/core/agents/queries';
import { api, unwrap } from '@/core/api/client';
import { useAiAction } from '@/modules/travel/ai-action';
import { AiProgress } from '@/modules/travel/ai-progress';
import type { TripInput } from '@/modules/travel/api';
import { OPTIONS, tripOf } from '@/modules/travel/testing/fake-trip';
import {
  backgroundRun,
  errorEnvelope,
  moduleView,
  resetModuleState,
  serveCancel,
  serveRun,
  server,
  testModules,
  testUser,
} from '@/test/msw';
import { renderApp, renderWithProviders } from '@/test/render';

/** describe-trip's trip (its budget in the currency's main unit, as it was said), with what a
 *  draft must never fill in slipped into it. */
const TRIP = {
  title: 'Goa honeymoon',
  destinations: [{ name: 'Goa', country: 'India', timezone: 'Asia/Kolkata' }],
  departure_city: null,
  start_date: '2026-11-20',
  end_date: '2026-11-24',
  trip_type: 'honeymoon',
  pace: 'relaxed',
  budget: 50_000,
  currency: 'INR',
  interests: ['beaches', 'seafood'],
  travellers: [{ name: 'Someone' }],
  notes: 'Made up',
  mode: 'premium',
  remind_prepare: true,
};
const draftOf = (trip: object): ClientAction => ({
  tool: 'travel_trip_draft',
  arguments: { trip },
});
const DRAFT = draftOf(TRIP);
const SAID = 'Honeymoon in Goa, 20 to 24 November, relaxed, beaches and seafood, ₹50,000';
const MANUAL = 'Or fill in the steps yourself below.';
/** The draft's zone as this browser names it among those it offers. */
const KOLKATA = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Kolkata' }).resolvedOptions()
  .timeZone;

/** A run that ended with the draft. */
const drafted = (changes: Partial<AgentRun> = {}) =>
  backgroundRun({
    status: 'completed',
    stages: ['understanding', 'drafting', 'checking', 'done'],
    client_actions: [DRAFT],
    message: 'I filled in your trip to Goa.',
    ...changes,
  });

let asked: unknown[];
let saved: TripInput[];
let refusal: { status: number; code: string } | null;

beforeAll(async () => {
  await import('@/modules/travel/travel-layout');
  await import('@/modules/travel/new-trip-page');
}, 120_000);

beforeEach(() => {
  asked = [];
  saved = [];
  refusal = null;
  resetModuleState([
    ...testModules,
    moduleView('travel', testModules.length, { status: 'beta', available: true }),
  ]);
  server.use(
    http.get('*/api/v1/travel/options', () => HttpResponse.json(OPTIONS)),
    http.get('*/api/v1/travel/trips', () =>
      HttpResponse.json({ items: [], page: 1, page_size: 20, total: 0, has_next: false }),
    ),
    http.post('*/api/v1/travel/trips', async ({ request }) => {
      const body = (await request.json()) as TripInput;
      saved.push(body);
      return HttpResponse.json(
        { ...tripOf({ title: body.title }), event_id: 'made' },
        { status: 201 },
      );
    }),
    http.post('*/api/v1/travel/assist', async ({ request }) => {
      asked.push(await request.json());
      return refusal
        ? HttpResponse.json(errorEnvelope(refusal.code, 'refused'), { status: refusal.status })
        : HttpResponse.json({ run_id: `run-${String(asked.length)}` }, { status: 202 });
    }),
  );
});

type User = ReturnType<typeof renderApp>['user'];

/** The first step, its trip chosen as Basic AI from the offer, and the trip described. */
async function describeIt(user: User) {
  const offer = await screen.findByRole('region', { name: 'Describe your trip' });
  await user.click(within(offer).getByRole('button', { name: 'Use Basic AI for this trip' }));
  const words = within(offer).getByRole('textbox', { name: 'Your trip in your words' });
  expect(words).toHaveFocus(); // where the button was
  await user.type(words, SAID);
  await user.click(within(offer).getByRole('button', { name: 'Draft the steps' }));
  return offer;
}

/** The trip described, and its draft filled into the steps. */
async function fillIt(user: User) {
  await describeIt(user);
  const preview = await screen.findByRole('region', { name: 'Drafted from your words' });
  await user.click(within(preview).getByRole('button', { name: 'Fill in the steps' }));
}

const field = (name: string | RegExp) => screen.getByRole('textbox', { name });
const next = (user: User) => user.click(screen.getByRole('button', { name: 'Next' }));

describe('describing a trip (Basic AI)', () => {
  it('drafts the steps from a sentence, showing its progress in fixed words while it works', async () => {
    serveRun(backgroundRun({ stages: ['understanding', 'drafting'] }));
    const { user } = renderApp('/m/travel/new');
    const offer = await screen.findByRole('region', { name: 'Describe your trip' });
    expect(
      within(offer).getByText(/describe the trip in your own words and it drafts these steps/),
    ).toBeInTheDocument();
    await describeIt(user);

    const progress = await screen.findByRole('list', { name: 'Progress' });
    await waitFor(() => {
      expect(within(progress).getByText('Writing a draft')).toBeInTheDocument();
    });
    expect(within(progress).getByText('Understanding your request')).toBeInTheDocument();
    expect(asked).toEqual([{ text: SAID, locale: 'en' }]);
  });

  it('shows the draft first, filling in nothing yet', async () => {
    serveRun(drafted());
    const { user, container } = renderApp('/m/travel/new');
    await describeIt(user);

    const preview = await screen.findByRole('region', { name: 'Drafted from your words' });
    expect(screen.queryByRole('list', { name: 'Progress' })).not.toBeInTheDocument();
    expect(
      screen.getByText('A draft is ready. Check it, then fill in the steps with it or cancel.'),
    ).toBeInTheDocument();
    const rows = within(preview)
      .getAllByRole('definition')
      .map((row) => row.textContent);
    expect(rows).toEqual([
      'Goa honeymoon',
      'Goa, India',
      expect.stringMatching(/Nov 20.*24, 2026 · 5 days/),
      'Honeymoon',
      'Relaxed',
      '₹50,000',
      'beaches, seafood',
    ]);
    expect(
      within(preview).getByText("Who's going, notes and the reminder stay yours to fill in."),
    ).toBeInTheDocument();
    expect(field(/Trip name/)).toHaveValue('');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('fills the steps in only when asked, leaves every step to check, and saves as usual', async () => {
    serveRun(drafted());
    const { user } = renderApp('/m/travel/new');
    await fillIt(user);
    expect(
      await screen.findByText('Filled in from your words. Check every step, then save the trip.'),
    ).toBeInTheDocument();
    expect(field(/Trip name/)).toHaveValue('Goa honeymoon');
    expect(field(/Trip name/)).toHaveFocus(); // the first thing to check
    expect(field('Place')).toHaveValue('Goa');
    expect(field('Country')).toHaveValue('India');
    expect(screen.getByLabelText('First day')).toHaveValue('2026-11-20');
    expect(screen.getByLabelText('Last day')).toHaveValue('2026-11-24');
    expect(screen.getByRole('combobox', { name: 'Time zone (optional)' })).toHaveValue(KOLKATA);

    // Every step is the person's to check; who goes, notes and the reminder are left to them.
    await next(user);
    expect(await screen.findByRole('heading', { name: "Who's going" })).toBeInTheDocument();
    expect(screen.getByText(/^Nobody added yet/)).toBeInTheDocument();
    await next(user);
    expect(await screen.findByRole('heading', { name: 'Style and budget' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Honeymoon' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Relaxed' })).toBeChecked();
    expect(field('Budget in INR (optional)')).toHaveValue('50000.00');
    expect(field(/Interests/)).toHaveValue('beaches, seafood');
    expect(field('Notes (optional)')).toHaveValue('');
    expect(
      screen.getByRole('switch', { name: 'Remind me the day before it starts' }),
    ).toHaveAttribute('aria-checked', 'false');
    await next(user);
    expect(await screen.findByRole('radio', { name: 'Basic AI' })).toBeChecked();
    expect(saved).toEqual([]); // nothing saved by the AI
    await next(user);
    await user.click(await screen.findByRole('button', { name: 'Save the trip' }));

    await waitFor(() => {
      expect(saved).toHaveLength(1);
    });
    expect(saved[0]).toEqual({
      title: 'Goa honeymoon',
      destinations: [{ name: 'Goa', country: 'India', timezone: KOLKATA }],
      departure_city: null,
      start_date: '2026-11-20',
      end_date: '2026-11-24',
      trip_type: 'honeymoon',
      pace: 'relaxed',
      currency: 'INR',
      budget_minor: 5_000_000,
      mode: 'basic',
      interests: ['beaches', 'seafood'],
      notes: null,
      remind_prepare: false,
      travellers: [],
    });
  });

  it('fills in nothing from a draft put aside, and puts back what the steps had', async () => {
    serveRun(drafted());
    const cancelled = serveCancel();
    const { user } = renderApp('/m/travel/new');
    await user.type(await screen.findByRole('textbox', { name: /Trip name/ }), 'My own trip');
    await describeIt(user);

    const preview = await screen.findByRole('region', { name: 'Drafted from your words' });
    await user.click(within(preview).getByRole('button', { name: 'Cancel' }));
    expect(
      screen.queryByRole('region', { name: 'Drafted from your words' }),
    ).not.toBeInTheDocument();
    expect(field(/Trip name/)).toHaveValue('My own trip');

    await user.click(screen.getByRole('button', { name: 'Draft the steps' }));
    await user.click(
      within(await screen.findByRole('region', { name: 'Drafted from your words' })).getByRole(
        'button',
        { name: 'Fill in the steps' },
      ),
    );
    expect(field(/Trip name/)).toHaveValue('Goa honeymoon');
    await user.click(screen.getByRole('button', { name: 'Put back what I had' }));
    expect(field(/Trip name/)).toHaveValue('My own trip');
    expect(field('Place')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Put back what I had' })).not.toBeInTheDocument();
    expect(cancelled).toEqual([]); // the runs had ended: nothing to stop
  });

  it('still offers to put back what the steps had after checking the other steps', async () => {
    serveRun(drafted());
    const { user } = renderApp('/m/travel/new');
    await user.type(await screen.findByRole('textbox', { name: /Trip name/ }), 'Mine');
    await fillIt(user);
    await next(user);
    await next(user);
    expect(await screen.findByRole('heading', { name: 'Style and budget' })).toBeInTheDocument();

    for (const step of ["Who's going", 'Where and when']) {
      await user.click(screen.getByRole('button', { name: 'Back' }));
      expect(await screen.findByRole('heading', { level: 2, name: step })).toBeInTheDocument();
    }
    expect(
      screen.getByText('Filled in from your words. Check every step, then save the trip.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Put back what I had' }));
    expect(field(/Trip name/)).toHaveValue('Mine');
    expect(field('Place')).toHaveValue('');
  });

  it('shows a currency the draft changes, and fills in its budget in that currency', async () => {
    serveRun(drafted({ client_actions: [draftOf({ ...TRIP, currency: 'JPY', budget: 150_000 })] }));
    const { user } = renderApp('/m/travel/new');
    await describeIt(user);

    const preview = await screen.findByRole('region', { name: 'Drafted from your words' });
    const rows = within(preview)
      .getAllByRole('term')
      .map((term) => [term.textContent, term.nextElementSibling?.textContent]);
    expect(rows).toEqual(
      expect.arrayContaining([
        ['Currency', 'JPY · Japanese Yen'],
        ['Budget', '¥150,000'],
      ]),
    );
    await user.click(within(preview).getByRole('button', { name: 'Fill in the steps' }));
    await next(user);
    await next(user);
    // Yen has no smaller unit: 150000 is as it was said.
    expect(await screen.findByRole('textbox', { name: 'Budget in JPY (optional)' })).toHaveValue(
      '150000',
    );
  });

  it('stops the run on Cancel: what it drafts after that is let go', async () => {
    const followed = serveRun(backgroundRun());
    const cancelled = serveCancel();
    const { user } = renderApp('/m/travel/new');
    await describeIt(user);
    await screen.findByText('Understanding your request');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('list', { name: 'Progress' })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(cancelled).toEqual(['run-1']);
    });
    const seen = followed.length;
    serveRun(drafted());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1800)); // past the next ask
    });
    expect(followed).toHaveLength(seen);
    expect(
      screen.queryByRole('region', { name: 'Drafted from your words' }),
    ).not.toBeInTheDocument();
    expect(field(/Trip name/)).toHaveValue('');
  });

  it.each([
    [
      'AI is off',
      backgroundRun({
        status: 'unavailable',
        mode: null,
        reason: 'no_provider',
        stages: ['understanding', 'done'],
      }),
      "The assistant can't help with that right now. AI isn't set up on this server.",
    ],
    [
      'the providers are resting',
      backgroundRun({
        status: 'unavailable',
        mode: null,
        reason: 'providers_failed',
        stages: ['understanding', 'done'],
      }),
      "The assistant can't help with that right now. The AI service isn't answering right now.",
    ],
    [
      "today's AI is used up",
      backgroundRun({
        status: 'unavailable',
        mode: null,
        reason: 'quota',
        stages: ['understanding', 'done'],
      }),
      "The assistant can't help with that right now. Today's AI limit is used up. It resets tomorrow.",
    ],
    [
      'it took too long',
      backgroundRun({
        status: 'incomplete',
        reason: 'timeout',
        stages: ['understanding', 'drafting'],
      }),
      'The assistant stopped before finishing. It took too long.',
    ],
    [
      'it stopped before drafting',
      backgroundRun({ status: 'incomplete', stages: ['understanding', 'drafting', 'done'] }),
      'The assistant stopped before finishing.',
    ],
    [
      'it asked instead of drafting',
      backgroundRun({
        status: 'completed',
        message: 'When does the trip start?',
        stages: ['understanding', 'done'],
      }),
      'When does the trip start?',
    ],
  ])('says why when %s, with Retry and the way by hand', async (_case, ended, why) => {
    serveRun(ended);
    const { user } = renderApp('/m/travel/new');
    await describeIt(user);

    expect(await screen.findByText(why)).toBeInTheDocument();
    expect(screen.getByText(MANUAL)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Turn on the AI assistant' }),
    ).not.toBeInTheDocument();
    expect(field(/Trip name/)).toHaveValue('');

    serveRun(drafted());
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('region', { name: 'Drafted from your words' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(why)).not.toBeInTheDocument();
    expect(asked).toHaveLength(2);
  });

  it('says why it could not start, with Retry', async () => {
    refusal = { status: 429, code: 'RATE_LIMITED' };
    serveRun(drafted());
    const { user } = renderApp('/m/travel/new');
    await describeIt(user);

    expect(await screen.findByText('Too many requests. Please wait a moment.')).toBeInTheDocument();
    expect(screen.getByText(MANUAL)).toBeInTheDocument();
    refusal = null;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('region', { name: 'Drafted from your words' }),
    ).toBeInTheDocument();
  });

  it('offers to turn AI on where that is why, then asks again', async () => {
    serveRun(
      backgroundRun({
        status: 'unavailable',
        mode: null,
        reason: 'consent',
        stages: ['understanding', 'done'],
      }),
    );
    let consented: unknown = null;
    server.use(
      http.patch('*/api/v1/me', async ({ request }) => {
        consented = await request.json();
        serveRun(drafted());
        return HttpResponse.json({ ...testUser, ai_consent: true });
      }),
    );
    const { user } = renderApp('/m/travel/new');
    await describeIt(user);

    expect(
      await screen.findByText(
        "The assistant can't help with that right now. AI is off for your account.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Turn on the AI assistant' }));
    expect(
      await screen.findByRole('region', { name: 'Drafted from your words' }),
    ).toBeInTheDocument();
    expect(consented).toEqual({ ai_consent: true });
    expect(asked).toHaveLength(2);
  });
});

/** One of a trip's AI actions, as the trip's pages build them on the same pieces. */
function DraftThisDay() {
  const ai = useAiAction({
    tool: 'travel_day_draft',
    start: (locale) =>
      unwrap(
        api.POST('/v1/travel/trips/{trip_id}/assist', {
          params: { path: { trip_id: 'goa' } },
          body: { task: 'day', day: '2026-11-06', locale },
        }),
      ),
    read: (action) =>
      Array.isArray(action.arguments.activities) ? action.arguments.activities : null,
  });
  return (
    <>
      <button type="button" onClick={() => void ai.ask()}>
        Draft this day
      </button>
      <AiProgress action={ai} manual="Or add activities yourself." />
      {ai.draft && <p>{`${String(ai.draft.length)} drafted`}</p>}
    </>
  );
}

describe("a trip's AI action", () => {
  it('says AI is only for a trip in Basic AI when the trip is not', async () => {
    server.use(
      http.post('*/api/v1/travel/trips/:id/assist', () =>
        HttpResponse.json(errorEnvelope('TRAVEL_AI_OFF', 'off', { mode: 'static' }), {
          status: 409,
        }),
      ),
    );
    const { user } = renderWithProviders(<DraftThisDay />);
    await user.click(screen.getByRole('button', { name: 'Draft this day' }));

    expect(
      await screen.findByText(
        'AI help is only for a trip in Basic AI. Switch the trip to it in its settings, or go on by hand.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Or add activities yourself.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('hands over a draft made before the run stopped, with nothing said against it', async () => {
    let body: unknown = null;
    server.use(
      http.post('*/api/v1/travel/trips/:id/assist', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ run_id: 'run-day' }, { status: 202 });
      }),
    );
    serveRun(
      backgroundRun({
        status: 'incomplete',
        stages: ['understanding', 'reading', 'drafting'],
        client_actions: [
          {
            tool: 'travel_day_draft',
            arguments: { trip_id: 'goa', day: '2026-11-06', activities: [{}, {}] },
          },
        ],
      }),
    );
    const { user } = renderWithProviders(<DraftThisDay />);
    await user.click(screen.getByRole('button', { name: 'Draft this day' }));

    expect(await screen.findByText('2 drafted')).toBeInTheDocument();
    expect(body).toEqual({ task: 'day', day: '2026-11-06', locale: 'en' });
    expect(screen.queryByText(/stopped before finishing/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});
