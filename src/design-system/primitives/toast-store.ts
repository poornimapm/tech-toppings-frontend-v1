import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'danger';

export interface ToastAction {
  label: string;
  onAction: () => void;
}

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  action?: ToastAction | undefined;
  /** Auto-dismiss after this long (paused while hovered or focused). */
  durationMs: number;
}

export interface ToastOptions {
  tone?: ToastTone;
  action?: ToastAction;
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 5000;
/** Older toasts make way: more than this at once is noise. */
const MAX_VISIBLE = 3;

interface ToastState {
  toasts: Toast[];
  show: (message: string, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
  clear: () => void;
}

let nextId = 1;

export const useToasts = create<ToastState>()((set) => ({
  toasts: [],
  show: (message, options = {}) => {
    const id = nextId++;
    const toast: Toast = {
      id,
      message,
      tone: options.tone ?? 'info',
      action: options.action,
      durationMs: options.durationMs ?? DEFAULT_DURATION_MS,
    };
    set((state) => ({ toasts: [...state.toasts, toast].slice(-MAX_VISIBLE) }));
    return id;
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
  clear: () => {
    set({ toasts: [] });
  },
}));

/** Show a short message at the bottom of the screen: `toast('Saved', { action })`. */
export function toast(message: string, options?: ToastOptions): number {
  return useToasts.getState().show(message, options);
}
