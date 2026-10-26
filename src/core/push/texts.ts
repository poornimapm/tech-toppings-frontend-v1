import { withDates } from '@/core/utils/date-params';
import { fill } from '@/core/utils/fill';
import { withMoney } from '@/core/utils/money-params';

/**
 * How the service worker words a push in the user's language (ADR-0018). The page has the
 * translations and writes this; the worker, which has none, reads it when a push arrives.
 */
export interface PushTexts {
  language: string;
  appName: string;
  /** For a kind of message this pack has no wording for (a module newer than the pack). */
  fallback: string;
  /** Wording by notification code; `{{module}}` is the module's name. */
  feed: Record<string, string>;
  /** Module names, and each module's home page, by module key. */
  modules: Record<string, { name: string; home: string }>;
  /** Where a notification code leads, under its module's home (`{{param}}`s filled in). */
  links: Record<string, string>;
}

/** What the server pushes: a notification's code and params, and a tag that replaces an
 *  earlier push of the same thing instead of stacking. */
export interface PushMessage {
  type: string;
  params: Record<string, unknown>;
  tag?: string;
}

export interface Notice {
  title: string;
  body: string;
  url: string;
  tag: string | undefined;
}

/** Where the page keeps the pack for the worker (Cache Storage: both can read it). */
export const PUSH_TEXTS_CACHE = 'tt-push-texts';
export const PUSH_TEXTS_URL = '/push-texts.json';
const INBOX = '/notifications';
/** Only when no pack was ever written (the page always writes one when turning pushes on). */
const BARE = { title: 'Tech-Toppings', body: 'You have a new notification.' };

export function noticeOf(texts: PushTexts | undefined, message: PushMessage): Notice {
  const key = typeof message.params.module === 'string' ? message.params.module : '';
  const module = texts?.modules[key];
  const template = texts?.feed[message.type];
  const values = texts
    ? {
        ...withDates(withMoney(message.params, texts.language), texts.language),
        module: module?.name,
      }
    : message.params;
  const link = texts?.links[message.type];
  const page = module
    ? `${module.home}${link ? `/${encodeURI(fill(link, message.params))}` : ''}`
    : INBOX;
  return {
    title: module?.name ?? texts?.appName ?? BARE.title,
    body: template ? fill(template, values) : (texts?.fallback ?? BARE.body),
    url: page,
    tag: message.tag,
  };
}

/** A push body as the worker gets it: anything that isn't one of ours is shown plainly. */
export function messageOf(text: string | undefined): PushMessage {
  try {
    const parsed: unknown = JSON.parse(text ?? '');
    if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
      const { type, params, tag } = parsed as Record<string, unknown>;
      return {
        type: String(type),
        params:
          typeof params === 'object' && params !== null ? (params as Record<string, unknown>) : {},
        tag: typeof tag === 'string' ? tag : undefined,
      };
    }
  } catch {
    // not JSON: fall through
  }
  return { type: '', params: {} };
}
