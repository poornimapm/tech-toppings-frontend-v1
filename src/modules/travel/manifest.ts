import { Plane } from 'lucide-react';

import { defineModule } from '@/core/modules/types';
import type { tripPages } from '@/modules/travel/trip-loader';

// Made from the spec of `poe new-module` (backend docs/modules/travel.yaml), then grown in
// Phase 18 (modules-usecases/Travel_Companion_Plan.md). Beta, for everyone. Only the sections
// built so far are routed: a section not built isn't offered.

type TripPages = Awaited<ReturnType<typeof tripPages>>;

/** One of a trip's pages. They load together, through a small loader chunk: the list of files
 *  they need is written there, not here in what loads with the first page (the budget). */
const tripPage = (name: keyof TripPages) => async () => ({
  Component: (await (await import('@/modules/travel/trip-loader')).tripPages())[name],
});

export default defineModule({
  key: 'travel',
  icon: Plane,
  accent: 'sky',
  keywords: ['trip', 'itinerary', 'holiday', 'packing', 'பயணம்', 'சுற்றுலா', 'यात्रा', 'सफ़र'],
  // One frame (the module's name and its sections' tabs) round every section.
  routes: [
    {
      lazy: async () => ({
        Component: (await import('@/modules/travel/travel-layout')).TravelLayout,
      }),
      children: [
        {
          index: true,
          lazy: async () => ({
            Component: (await import('@/modules/travel/home-page')).HomePage,
          }),
        },
        {
          path: 'trips',
          lazy: async () => ({
            Component: (await import('@/modules/travel/trips-page')).TripsPage,
          }),
        },
        {
          path: 'new',
          lazy: async () => ({
            Component: (await import('@/modules/travel/new-trip-page')).NewTripPage,
          }),
        },
        // One trip, its own tabs round its sections.
        {
          path: 'trips/:id',
          lazy: tripPage('TripLayout'),
          children: [
            { index: true, lazy: tripPage('OverviewTab') },
            { path: 'itinerary', lazy: tripPage('ItineraryTab') },
            { path: 'prepare', lazy: tripPage('PrepareTab') },
            { path: 'packing', lazy: tripPage('PackingTab') },
            { path: 'budget', lazy: tripPage('BudgetTab') },
            { path: 'bookings', lazy: tripPage('BookingsTab') },
            { path: 'history', lazy: tripPage('HistoryTab') },
          ],
        },
      ],
    },
  ],
  // A checklist or packing tick made with no network waits on the device (ADR-0010).
  outbox: { 'travel.tick': async () => (await import('@/modules/travel/outbox')).sendTick },
  // The reminder comes the day before the trip: it opens its first day (`due_on`) to prepare,
  // whenever it is opened.
  links: { 'travel.prepare_due': 'trips/{{trip_id}}/prepare?when={{due_on}}' },
  // Only what the shell shows outside the module (tile, dashboard, feed, reminders, search) is
  // here; the module's own screens are worded in ./i18n and load with them.
  strings: {
    en: {
      name: 'Travel',
      tagline: 'Plan your trips, day by day',
      description:
        'Plan each trip day by day, change the plan as things happen, and see exactly what each change touched.',
      stats: { items: 'trips ahead' },
      widgets: { travel_next_trip: 'Next trip' },
      feed: {
        'travel.trip_added': 'Planned “{{title}}” in {{module}}',
        'travel.trip_updated': 'Edited “{{title}}” in {{module}}',
        'travel.trip_deleted': 'Deleted “{{title}}” from {{module}}',
        'travel.trip_restored': 'Brought “{{title}}” back to {{module}}',
        'travel.booking_added': 'Added the booking “{{title}}” to “{{trip}}”',
        'travel.expense_added': 'Added the cost “{{title}}” to “{{trip}}”',
        'travel.trip_active': '“{{title}}” is under way',
        'travel.trip_upcoming': 'Coming up: “{{title}}”',
        'travel.prepare_due': '“{{title}}” starts {{due}}: time to get ready',
      },
      search: { trip: 'Trip' },
    },
  },
});
