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

let prefersDark = false;
const lists = new Set<FakeMediaQueryList>();

export function installMatchMedia(): void {
  window.matchMedia = (query: string) => {
    const list = new FakeMediaQueryList(query, () =>
      query.includes('prefers-color-scheme: dark') ? prefersDark : false,
    );
    lists.add(list);
    return list;
  };
}

/** Simulate the OS switching colour scheme. */
export function setPrefersDark(value: boolean): void {
  prefersDark = value;
  for (const list of lists) {
    list.dispatchEvent(new Event('change'));
  }
}

export function resetMatchMedia(): void {
  prefersDark = false;
  lists.clear();
}
