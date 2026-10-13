/** Controllable stand-in for window.matchMedia (jsdom has none). */
class FakeMediaQueryList extends EventTarget implements MediaQueryList {
  readonly media: string;
  onchange: ((this: MediaQueryList, event: MediaQueryListEvent) => unknown) | null = null;
  private readonly isMatching: () => boolean;

  constructor(media: string, isMatching: () => boolean) {
    super();
    this.media = media;
    this.isMatching = isMatching;
  }

  get matches(): boolean {
    return this.isMatching();
  }

  addListener(): void {
    // deprecated API, unused
  }

  removeListener(): void {
    // deprecated API, unused
  }
}

/** Fragments of media queries that currently match; nothing matches until a test says so. */
const matching = new Set<string>();
const lists = new Set<FakeMediaQueryList>();

export function installMatchMedia(): void {
  window.matchMedia = (query: string) => {
    const list = new FakeMediaQueryList(query, () =>
      [...matching].some((fragment) => query.includes(fragment)),
    );
    lists.add(list);
    return list;
  };
}

/** Make every media query containing `fragment` match (or stop matching), and tell listeners. */
function setMedia(fragment: string, matches: boolean): void {
  if (matches) matching.add(fragment);
  else matching.delete(fragment);
  for (const list of lists) {
    list.dispatchEvent(new Event('change'));
  }
}

/** Simulate the OS switching colour scheme. */
export function setPrefersDark(value: boolean): void {
  setMedia('prefers-color-scheme: dark', value);
}

/** Simulate a screen wide enough for the header navigation (Tailwind's `sm` and up). */
export function setWideScreen(value: boolean): void {
  setMedia('min-width', value);
}

export function resetMatchMedia(): void {
  matching.clear();
  lists.clear();
}
