import { describe, expect, it } from 'vitest';

import type { ClientAction } from '@/core/agents/queries';
import { dayDraftOf } from '@/modules/travel/ai-drafts';
import { tripDraftOf } from '@/modules/travel/trip-draft';

const DAY = '2026-11-06';
const dayDraft = (activities: unknown[]): ClientAction => ({
  tool: 'travel_day_draft',
  arguments: { trip_id: 'goa', day: DAY, activities },
});
const tripDraft = (more: object): ClientAction => ({
  tool: 'travel_trip_draft',
  arguments: {
    trip: {
      title: 'Tokyo in winter',
      destinations: [{ name: 'Tokyo', country: 'Japan' }],
      start_date: '2026-12-01',
      end_date: '2026-12-05',
      ...more,
    },
  },
});

describe('money in an AI draft, said in the currency’s main unit', () => {
  it('goes to a drafted day’s preview in minor units of the trip’s currency', () => {
    const drafted = dayDraft([
      { title: 'Temple', kind: 'sightseeing', estimated_cost: 1500 },
      { title: 'Lunch', kind: 'food', estimated_cost: 250.5 },
      { title: 'Walk', kind: 'other', estimated_cost: 'free', estimated_cost_minor: 99 },
    ]);
    expect(dayDraftOf(drafted, { id: 'goa', currency: 'JPY' }, DAY)).toEqual([
      { title: 'Temple', kind: 'sightseeing', estimated_cost_minor: 1500 },
      { title: 'Lunch', kind: 'food', estimated_cost_minor: 251 }, // rounded as the server does
      { title: 'Walk', kind: 'other' },
    ]);
    expect(dayDraftOf(drafted, { id: 'goa', currency: 'INR' }, DAY)).toEqual([
      { title: 'Temple', kind: 'sightseeing', estimated_cost_minor: 150_000 },
      { title: 'Lunch', kind: 'food', estimated_cost_minor: 25_050 },
      { title: 'Walk', kind: 'other' },
    ]);
  });

  it('fills a described trip’s budget in as typed in its own currency, else the form’s', () => {
    expect(tripDraftOf(tripDraft({ currency: 'JPY', budget: 150_000 }), 'INR')).toMatchObject({
      currency: 'JPY',
      budget: '150000',
    });
    expect(tripDraftOf(tripDraft({ budget: 50_000 }), 'INR')).toMatchObject({ budget: '50000.00' });
    for (const odd of [-5, '50000', null]) {
      expect(tripDraftOf(tripDraft({ budget: odd }), 'INR')).not.toHaveProperty('budget');
    }
    // Minor units are no longer what a draft carries.
    expect(tripDraftOf(tripDraft({ budget_minor: 5_000_000 }), 'INR')).not.toHaveProperty('budget');
  });
});
