/** A choice drawn as a large pill; the radio inside keeps the keyboard and screen-reader
 *  behaviour. Large enough to tap with a thumb (44 px). */
export const CHOICE =
  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface/60 px-4 py-2 text-sm ' +
  'has-checked:border-primary has-checked:bg-primary/10 has-checked:font-semibold ' +
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--tt-focus)]';

/** A link drawn as the page's main button, as tall as a thumb. */
export const MAIN_LINK =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-base font-medium text-primary-contrast hover:opacity-90';

/** A link drawn as a second button beside it. */
export const SIDE_LINK =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-base font-medium hover:bg-bg';
