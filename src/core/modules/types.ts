import type { LucideIcon } from 'lucide-react';
import type { RouteObject } from 'react-router';

import type { components } from '@/core/api/schema';
import type { Language } from '@/core/i18n';

/** A module as the API reports it for the signed-in user (status, availability, stat ...). */
export type ModuleView = components['schemas']['ModuleView'];

/** Colour families; each maps to a contrast-checked token pair in tokens.css. */
export const ACCENTS = [
  'emerald',
  'rose',
  'amber',
  'sky',
  'indigo',
  'orange',
  'violet',
  'teal',
  'slate',
] as const;
export type ModuleAccent = (typeof ACCENTS)[number];

export interface ModuleStrings {
  name: string;
  /** One line under the name on the tile. */
  tagline: string;
  /** A short paragraph for the details dialog. */
  description: string;
  /** Labels for the tile figure, keyed by the `label` the API sends with it. */
  stats?: Record<string, string>;
  /** Titles of the module's dashboard widgets, keyed by widget key. */
  widgets?: Record<string, string>;
  /** Wording of the module's activity entries and notifications, keyed by their code;
   *  `{{name}}` takes a parameter, `{{module}}` the module's name. */
  feed?: Record<string, string>;
  /** Wording of the static-mode answers of the module's agent skills, keyed by message code. */
  replies?: Record<string, string>;
}

/**
 * What a module's frontend folder declares in `src/modules/<slug>/manifest.ts` (ADR-0001).
 * Presentation only: whether a module is live, enabled or pinned comes from the API.
 */
export interface ModuleDefinition {
  /** Equals the backend manifest key (e.g. `gov_docs`); the folder is its slug (`gov-docs`). */
  key: string;
  icon: LucideIcon;
  accent: ModuleAccent;
  /** Every supported language; English is the fallback for missing ones. */
  strings: Record<'en', ModuleStrings> & Partial<Record<Language, ModuleStrings>>;
  /** Extra words people might search for (any language). */
  keywords?: readonly string[];
  /** Lazy pages, mounted under `/m/<slug>` once the module is live. */
  routes?: RouteObject[];
  /** Pages an agent's client tools may show: tool name -> path under `/m/<slug>` ('' = home). */
  actions?: Record<string, string>;
  /** Where a notification leads, by its code: a path under `/m/<slug>` with `{{param}}`s filled
   *  from the notification (otherwise it leads to the module's home). */
  links?: Record<string, string>;
}

/** A module ready to render: the API's view merged with its frontend definition. */
export interface ModuleTile {
  view: ModuleView;
  definition: ModuleDefinition;
  /** Localised strings for the current language. */
  text: ModuleStrings;
}

/** Typed helper so manifests get autocompletion and checks. */
export function defineModule(definition: ModuleDefinition): ModuleDefinition {
  return definition;
}
