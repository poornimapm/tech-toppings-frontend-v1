import { Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/** Search box with the usual shortcuts: "/" or Ctrl/⌘+K focuses it, Escape clears it. */
export function SearchField({ label, value, onChange, placeholder }: SearchFieldProps) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const shortcut =
        (event.key === '/' && !isTypingTarget(event.target)) ||
        (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey));
      if (shortcut) {
        event.preventDefault();
        input.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className="group relative w-full">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4.5 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary"
      />
      <input
        ref={input}
        type="search"
        aria-label={label}
        aria-keyshortcuts="/ Control+K Meta+K"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onChange('');
          }
        }}
        className="block w-full rounded-2xl border border-border bg-surface/70 py-3 pr-20 pl-10 text-text shadow-sm backdrop-blur transition placeholder:text-muted focus:border-primary focus:bg-surface focus:shadow-lg focus:shadow-primary/10 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 items-center gap-1">
        {value ? (
          <button
            type="button"
            aria-label={t('actions.clearSearch')}
            className="rounded-full p-1 text-muted hover:bg-bg hover:text-text"
            onClick={() => {
              onChange('');
              input.current?.focus();
            }}
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : (
          <kbd
            aria-hidden="true"
            className="hidden rounded-md border border-border bg-bg px-1.5 py-0.5 font-sans text-xs text-muted sm:inline"
          >
            /
          </kbd>
        )}
      </div>
    </div>
  );
}
