import { House, KeyRound, ShieldCheck, type LucideIcon } from 'lucide-react';

export interface PageMeta {
  path: string;
  /** Translation key of the page's name (common namespace). */
  labelKey: 'nav.home' | 'nav.security' | 'security.changePassword';
  icon: LucideIcon;
  /** Extra search words for the command palette. */
  keywords: readonly string[];
}

/** The shell's pages: the router mounts them and the command palette lists them. */
export const pages = {
  home: { path: '/', labelKey: 'nav.home', icon: House, keywords: ['welcome', 'modules'] },
  security: {
    path: '/account/security',
    labelKey: 'nav.security',
    icon: ShieldCheck,
    keywords: ['devices', 'sessions'],
  },
  changePassword: {
    path: '/change-password',
    labelKey: 'security.changePassword',
    icon: KeyRound,
    keywords: ['password'],
  },
} satisfies Record<string, PageMeta>;
