import { create } from 'zustand';

/** Words to put to the assistant; each ask is its own, even with the same words. */
export interface Question {
  id: string;
  text: string;
}

interface PaletteState {
  open: boolean;
  /** Words to put to the assistant as soon as the palette opens (Simple mode's microphone).
   *  Closing the palette, by any path, drops a question it hasn't taken. */
  question: Question | null;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  ask: (text: string) => void;
  /** The palette takes the question with this id: its words, or null if it is gone. */
  take: (id: string) => string | null;
}

/** Whether the command palette is open; any component (header button, shortcut) can open it. */
export const usePalette = create<PaletteState>()((set, get) => ({
  open: false,
  question: null,
  setOpen: (open) => {
    set(open ? { open } : { open, question: null });
  },
  toggle: () => {
    get().setOpen(!get().open);
  },
  ask: (text) => {
    set({ open: true, question: { id: crypto.randomUUID(), text } });
  },
  take: (id) => {
    const { question } = get();
    if (question?.id !== id) return null;
    set({ question: null });
    return question.text;
  },
}));

/** The palette's code is fetched on first use, so it stays out of the first page load. */
export const loadPalette = () => import('@/platform/palette/command-palette');
