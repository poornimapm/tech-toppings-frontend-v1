import { HardHat } from 'lucide-react';

import { defineModule } from '@/core/modules/types';

// Made by `poe new-module` (backend docs/modules/new-module.md), then grown (Phase 16). Only
// the accounts an admin gives it to (and admins) see it: the API lists it for them alone.
export default defineModule({
  key: 'labor',
  icon: HardHat,
  accent: 'orange',
  keywords: [
    'workers',
    'attendance',
    'wages',
    'payroll',
    'labour',
    'farm',
    'தொழிலாளர்',
    'கூலி',
    'मज़दूर',
    'मजदूरी',
  ],
  // One frame (the project picker and the sections' tabs) round every section.
  routes: [
    {
      lazy: async () => ({
        Component: (await import('@/modules/labor/labor-layout')).LaborLayout,
      }),
      children: [
        {
          index: true,
          lazy: async () => ({
            Component: (await import('@/modules/labor/overview-page')).OverviewPage,
          }),
        },
        {
          path: 'projects',
          lazy: async () => ({
            Component: (await import('@/modules/labor/projects-page')).ProjectsPage,
          }),
        },
        {
          path: 'attendance',
          lazy: async () => ({
            Component: (await import('@/modules/labor/attendance-page')).AttendancePage,
          }),
        },
        {
          path: 'workers',
          lazy: async () => ({
            Component: (await import('@/modules/labor/workers-page')).WorkersPage,
          }),
        },
        {
          path: 'wages',
          lazy: async () => ({
            Component: (await import('@/modules/labor/wages-page')).WagesPage,
          }),
        },
        {
          path: 'payments',
          lazy: async () => ({
            Component: (await import('@/modules/labor/payments-page')).PaymentsPage,
          }),
        },
        {
          path: 'reports',
          lazy: async () => ({
            Component: (await import('@/modules/labor/reports-page')).ReportsPage,
          }),
        },
        {
          path: 'audit',
          lazy: async () => ({
            Component: (await import('@/modules/labor/audit-page')).AuditPage,
          }),
        },
        {
          path: 'all',
          lazy: async () => ({
            Component: (await import('@/modules/labor/all-page')).AllPage,
          }),
        },
      ],
    },
  ],
  // A mark tapped with no network waits on the device (ADR-0010).
  outbox: { 'labor.marks': async () => (await import('@/modules/labor/outbox')).sendMarks },
  // Marks the assistant read ("Ravi full day") open on the attendance page, to check and save.
  actions: { labor_attendance_draft: 'attendance' },
  strings: {
    en: {
      name: 'Labor Management',
      tagline: 'Workers, days and wages, simply',
      description:
        'Projects, workers with their photos, attendance in a tap, wages and what is owed, with every change kept.',
      stats: { items: 'projects' },
      replies: {
        'mark-attendance.ready': 'Marks read: check them, then save.',
        'mark-attendance.unsure': 'Marks read, some to check: then save.',
        'mark-attendance.which_project': "Which project? Say it on that project's attendance.",
        'mark-attendance.no_project': 'There is no open project to mark.',
      },
    },
  },
});
