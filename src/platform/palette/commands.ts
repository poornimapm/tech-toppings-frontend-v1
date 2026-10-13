import {
  Bell,
  Eye,
  Languages,
  LogOut,
  Monitor,
  Moon,
  Star,
  StarOff,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useSavePreferences } from '@/core/auth/use-save-preferences';
import { useSignOut } from '@/core/auth/use-sign-out';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, toLanguage } from '@/core/i18n';
import { useModuleTiles } from '@/core/modules/queries';
import { slugOf } from '@/core/modules/registry';
import type { ModuleTile } from '@/core/modules/types';
import { useThemeStore, type ThemePreference } from '@/core/theme/theme-store';
import { pages } from '@/platform/shell/pages';
import { isOpenable } from '@/platform/welcome/module-style';
import { useModuleActions } from '@/platform/welcome/use-module-actions';

export type CommandGroup = 'pages' | 'modules' | 'preferences' | 'account';

export interface Command {
  id: string;
  group: CommandGroup;
  label: string;
  icon: LucideIcon;
  keywords?: readonly string[];
  run: () => void;
}

const THEME_ICONS: Record<ThemePreference, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

/** Where "open" takes a module: its pages when it has them, otherwise its details. */
export function moduleHref(tile: ModuleTile): string {
  return isOpenable(tile) ? `/m/${slugOf(tile.view.key)}` : `/?module=${tile.view.key}`;
}

function usePageCommands(): Command[] {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return Object.entries(pages).map(([id, page]) => ({
    id: `page:${id}`,
    group: 'pages',
    label: t(page.labelKey),
    icon: page.icon,
    keywords: page.keywords,
    run: () => void navigate(page.path),
  }));
}

function useModuleCommands(): Command[] {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tiles } = useModuleTiles();
  const actions = useModuleActions();
  return tiles.flatMap((tile) => {
    const { key, pinned, enabled, status, global_enabled, notify_requested } = tile.view;
    const name = tile.text.name;
    const keywords = [tile.definition.strings.en.name, ...(tile.definition.keywords ?? [])];
    const command = (id: string, label: string, icon: LucideIcon, run: () => void): Command => ({
      id: `${id}:${key}`,
      group: 'modules',
      label,
      icon,
      keywords,
      run,
    });
    if (!enabled) {
      return [
        command('show', t('welcome.show', { name }), Eye, () => {
          actions.setVisible(tile, true);
        }),
      ];
    }
    const commands = [
      command('open', t('welcome.tile.open', { name }), tile.definition.icon, () => {
        void navigate(moduleHref(tile));
      }),
      command(
        'pin',
        t(pinned ? 'welcome.tile.unpin' : 'welcome.tile.pin', { name }),
        pinned ? StarOff : Star,
        () => {
          actions.setPinned(tile, !pinned);
        },
      ),
    ];
    if (status === 'coming_soon' && global_enabled && !notify_requested) {
      commands.push(
        command('notify', t('palette.notify', { name }), Bell, () => {
          actions.setNotify(tile, true);
        }),
      );
    }
    return commands;
  });
}

function usePreferenceCommands(): Command[] {
  const { t, i18n } = useTranslation();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const save = useSavePreferences();
  const themes = (['light', 'dark', 'system'] as const)
    .filter((theme) => theme !== preference)
    .map((theme): Command => ({
      id: `theme:${theme}`,
      group: 'preferences',
      label: t('palette.theme', { name: t(`theme.${theme}`) }),
      icon: THEME_ICONS[theme],
      run: () => {
        setPreference(theme);
        save({ theme });
      },
    }));
  const languages = SUPPORTED_LANGUAGES.filter(
    (language) => language !== toLanguage(i18n.language),
  ).map((language): Command => ({
    id: `language:${language}`,
    group: 'preferences',
    label: t('palette.language', { name: LANGUAGE_NAMES[language] }),
    icon: Languages,
    keywords: [language],
    run: () => {
      void i18n.changeLanguage(language);
      save({ locale: language });
    },
  }));
  return [...themes, ...languages];
}

/** Everything the palette can do without AI, from the app's own registries. */
export function useCommands(): Command[] {
  const { t } = useTranslation();
  const signOut = useSignOut();
  return [
    ...usePageCommands(),
    ...useModuleCommands(),
    ...usePreferenceCommands(),
    {
      id: 'account:sign-out',
      group: 'account',
      label: t('nav.signOut'),
      icon: LogOut,
      run: signOut,
    },
  ];
}
