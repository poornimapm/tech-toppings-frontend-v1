import { http, HttpResponse } from 'msw/http';

import type { components } from '@/core/api/schema';
import { addDays, displayDate } from '@/core/utils/dates';

type Schemas = components['schemas'];
type Entry = Schemas['EntryOut'];
type Insight = Schemas['InsightOut'];

const API = '*/api/v1/expenses';

const total = (items: readonly Entry[]) => items.reduce((sum, item) => sum + item.amount_minor, 0);
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

function daysBetween(from: string, to: string): string[] {
  const found: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) found.push(day);
  return found;
}

function groups(items: readonly Entry[], key: (entry: Entry) => string | null) {
  const found = new Map<string | null, Entry[]>();
  for (const item of items) found.set(key(item), [...(found.get(key(item)) ?? []), item]);
  return [...found].sort(([, a], [, b]) => total(b) - total(a));
}

/** A summary as the skill's templates would give it, without AI. */
export function insightOf(changes: Partial<Insight> = {}): Insight {
  return {
    period: 'month',
    start: '2026-10-01',
    end: '2026-10-31',
    status: 'completed',
    mode: 'static',
    reason: null,
    message: null,
    message_code: 'explain-spending.month.more',
    message_params: {
      currency: 'INR',
      spent_minor: 72500,
      pct: 12,
      category: 'transport',
      category_amount_minor: 60000,
    },
    facts: {},
    cached: false,
    ...changes,
  };
}

/**
 * The analytics endpoints over the fake's own entries, filtered as the entries list filters
 * them (`matching`): a chart's figure and the list it opens add up the same entries. The
 * forecast, anomalies and products are fixtures; the server's own tests cover how they are
 * worked out.
 */
export function fakeAnalytics(
  matching: (url: URL) => Entry[],
  state: { insight: Insight; unusual: Schemas['Unusual'][] },
) {
  const range = (url: URL) => ({
    start: url.searchParams.get('from') ?? '2026-10-01',
    end: url.searchParams.get('to') ?? '2026-10-08',
  });
  const spending = (url: URL) => {
    const query = new URL(url);
    if (!query.searchParams.get('kind')) query.searchParams.set('kind', 'expense');
    return matching(query);
  };
  const shares = (url: URL, key: (entry: Entry) => string | null, name: string) => {
    const items = spending(url);
    const whole = total(items);
    return {
      ...range(url),
      currency: 'INR',
      kind: 'expense',
      total_minor: whole,
      items: groups(items, key).map(([value, group]) => ({
        [name]: value,
        amount_minor: total(group),
        count: group.length,
        share_pct: pct(total(group), whole),
      })),
    };
  };
  const answers: Record<string, (url: URL) => unknown> = {
    summary: (url) => {
      const all = matching(url);
      const spent = total(all.filter((item) => item.kind === 'expense'));
      const received = total(all.filter((item) => item.kind === 'income'));
      const { start, end } = range(url);
      const days = daysBetween(start, end).length;
      return {
        start,
        end,
        currency: 'INR',
        spent_minor: spent,
        received_minor: received,
        net_minor: received - spent,
        count: all.length,
        days,
        avg_daily_spent_minor: Math.round(spent / days),
        savings_rate_pct: received ? pct(received - spent, received) : null,
        previous: { start: addDays(start, -days), end: addDays(start, -1) },
        previous_totals: { spent_minor: 0, received_minor: 0, net_minor: 0, count: 0 },
        spent_change_pct: null,
        received_change_pct: null,
      };
    },
    'by-category': (url) => shares(url, (entry) => entry.category_id, 'category_id'),
    'by-person': (url) => shares(url, (entry) => entry.for_whom ?? null, 'name'),
    'top-merchants': (url) => {
      const found = shares(url, (entry) => entry.merchant ?? null, 'merchant');
      return { ...found, items: found.items.filter((item) => item.merchant) };
    },
    daily: (url) => {
      const items = spending(url);
      const { start, end } = range(url);
      return {
        start,
        end,
        currency: 'INR',
        kind: 'expense',
        points: daysBetween(start, end).map((date) => {
          const that = items.filter((item) => item.date === date);
          return { date, amount_minor: total(that), count: that.length };
        }),
      };
    },
    cumulative: (url) => {
      const items = spending(url);
      const { start, end } = range(url);
      const days = daysBetween(start, end);
      let running = 0;
      return {
        start,
        end,
        currency: 'INR',
        kind: 'expense',
        points: days.map((date) => {
          running += total(items.filter((item) => item.date === date));
          return { date, total_minor: running };
        }),
        previous: { start: addDays(start, -days.length), end: addDays(start, -1) },
        previous_points: days.map((_, index) => ({
          date: addDays(start, index - days.length),
          total_minor: 0,
        })),
      };
    },
    'weekday-heatmap': (url) => {
      const items = spending(url);
      const { start, end } = range(url);
      const monday = addDays(start, -((displayDate(start).getDay() + 6) % 7));
      const weeks = [];
      for (let week = monday; week <= end; week = addDays(week, 7)) {
        weeks.push({
          start: week,
          days: Array.from({ length: 7 }, (_, index) => {
            const date = addDays(week, index);
            return date < start || date > end
              ? null
              : { date, amount_minor: total(items.filter((item) => item.date === date)) };
          }),
        });
      }
      return {
        start,
        end,
        currency: 'INR',
        kind: 'expense',
        weeks,
        weekdays: Array.from({ length: 7 }, (_, weekday) => ({
          weekday,
          total_minor: 0,
          average_minor: weekday === 2 ? 30000 : 0,
        })),
      };
    },
    net: (url) => ({
      ...range(url),
      currency: 'INR',
      months: [
        {
          month: '2026-09',
          start: '2026-09-01',
          end: '2026-09-30',
          spent_minor: 12500,
          received_minor: 0,
          net_minor: -12500,
          count: 1,
          savings_rate_pct: null,
          cumulative_net_minor: -12500,
        },
        {
          month: '2026-10',
          start: '2026-10-01',
          end: '2026-10-08',
          spent_minor: 72500,
          received_minor: 5000000,
          net_minor: 4927500,
          count: 4,
          savings_rate_pct: 98.6,
          cumulative_net_minor: 4915000,
        },
      ],
      total: { spent_minor: 85000, received_minor: 5000000, net_minor: 4915000, count: 5 },
      savings_rate_pct: 98.3,
    }), // fmt: skip
    forecast: () => ({
      start: '2026-10-01',
      end: '2026-10-31',
      currency: 'INR',
      month: '2026-10',
      today: '2026-10-08',
      spent_minor: 72500,
      days_left: 23,
      pace_daily_minor: 9000,
      projected_minor: 279500,
      low_minor: 210000,
      high_minor: 350000,
      lookback_days: 30,
      previous_month_minor: 12500,
    }),
    'top-products': (url) => ({ ...range(url), currency: 'INR', items: [] }),
    anomalies: (url) => ({ ...range(url), currency: 'INR', items: state.unusual }),
  };

  return [
    http.get(`${API}/analytics/:name`, ({ params, request }) => {
      const answer = answers[String(params.name)];
      return answer
        ? HttpResponse.json(answer(new URL(request.url)) as Record<string, unknown>)
        : new HttpResponse(null, { status: 404 });
    }),
    http.get(`${API}/insights`, () => HttpResponse.json(state.insight)),
    http.post(`${API}/insights/refresh`, () => {
      state.insight = insightOf({
        mode: 'agent',
        message: 'Written again, by the AI.',
        message_code: null,
        message_params: {},
      });
      return HttpResponse.json(state.insight);
    }),
  ];
}
