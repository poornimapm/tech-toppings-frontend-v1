import { lazy, Suspense, useEffect, useState } from 'react';

import { loadPalette, usePalette } from '@/platform/palette/palette-store';

const CommandPalette = lazy(async () => ({ default: (await loadPalette()).CommandPalette }));

/** Listens for ⌘K / Ctrl+K, and mounts the command palette once it has been asked for. */
export function PaletteHost() {
  const open = usePalette((state) => state.open);
  const toggle = usePalette((state) => state.toggle);
  const [wanted, setWanted] = useState(open);
  if (open && !wanted) setWanted(true);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [toggle]);

  return wanted ? (
    <Suspense fallback={null}>
      <CommandPalette />
    </Suspense>
  ) : null;
}
