import {
  Bell,
  History,
  House,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  type LucideIcon,
} from 'lucide-react';

export interface PageMeta {
  path: string;
  /** Translation key of the page's name (common namespace). */
  labelKey:
    | 'nav.home'
    | 'nav.dashboard'
    | 'nav.notifications'
    | 'nav.activity'
    | 'nav.security'
    | 'nav.admin'
    | 'security.changePassword';
  icon: LucideIcon;
  /** Extra search words for the command palette. */
  keywords: readonly string[];
  /** Listed only for admins (the API refuses everyone else anyway). */
  adminOnly?: boolean;
}

/** The shell's pages: the router mounts them, and the navigation and command palette list them. */
export const pages = {
  home: { path: '/', labelKey: 'nav.home', icon: House, keywords: ['welcome', 'modules'] },
  dashboard: {
    path: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    keywords: ['stats', 'charts', 'overview', 'insights'],
  },
  notifications: {
    path: '/notifications',
    labelKey: 'nav.notifications',
    icon: Bell,
    keywords: ['inbox', 'alerts', 'updates', 'news'],
  },
  activity: {
    path: '/activity',
    labelKey: 'nav.activity',
    icon: History,
    keywords: ['history', 'log', 'recent'],
  },
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
  admin: {
    path: '/admin',
    labelKey: 'nav.admin',
    icon: UserCog,
    keywords: ['users', 'allowlist', 'audit', 'usage', 'analytics'],
    adminOnly: true,
  },
} satisfies Record<string, PageMeta>;
