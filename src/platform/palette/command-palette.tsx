import { Command as Cmdk } from 'cmdk';
import { ArrowLeft, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useAgents, useAskAgent } from '@/core/agents/queries';
import { env } from '@/core/config/env';
import { toLanguage } from '@/core/i18n';
import { useModuleTiles } from '@/core/modules/queries';
import { AssistantPanel } from '@/platform/palette/assistant-panel';
import { useCommands, type Command, type CommandGroup } from '@/platform/palette/commands';
import { usePalette } from '@/platform/palette/palette-store';
import { SearchResults } from '@/platform/palette/search-results';

const GROUPS: CommandGroup[] = ['pages', 'modules', 'preferences', 'account'];

const item =
  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm aria-selected:bg-primary/10 aria-selected:text-primary';

function AiStatus() {
  const { t } = useTranslation();
  const agent = useAgents().data?.find((view) => view.name === env.assistantAgent);
  if (!agent) return null;
  const state = agent.mode ?? 'off';
  return (
    <span className="text-xs text-muted">
      {t(`agents.aiStatus.${state}`)}
      {agent.mode === 'agent' && ` · ${t('agents.quota', { count: agent.quota_remaining })}`}
    </span>
  );
}

/** Jump anywhere, change things, or ask the assistant. Loaded on first use (palette-host). */
export function CommandPalette() {
  const { t, i18n } = useTranslation();
  const { open, setOpen } = usePalette();
  const [query, setQuery] = useState('');
  const [asking, setAsking] = useState(false);
  const commands = useCommands();
  const { tiles } = useModuleTiles();
  const ask = useAskAgent(env.assistantAgent);
  const navigate = useNavigate();

  function close(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery('');
      setAsking(false);
      ask.reset();
    }
  }

  function askAssistant() {
    setAsking(true);
    ask.mutate({
      input: query,
      locale: toLanguage(i18n.language),
      // The names the user sees, so "Habit tracker" or "பழக்கம்" both find the module.
      context: { modules: tiles.map((tile) => ({ key: tile.view.key, name: tile.text.name })) },
    });
  }

  function run(command: Command) {
    command.run();
    close(false);
  }

  return (
    <Cmdk.Dialog
      open={open}
      onOpenChange={close}
      label={t('palette.title')}
      loop
      overlayClassName="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      contentClassName="fixed top-[12dvh] left-1/2 z-50 w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl animate-[tt-pop_160ms_ease-out]"
    >
      <div className="flex items-center gap-3 border-b border-border px-4">
        {asking ? (
          <button
            type="button"
            aria-label={t('palette.back')}
            className="rounded-full p-1 text-muted hover:bg-bg hover:text-text"
            onClick={() => {
              setAsking(false);
              ask.reset();
            }}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
        ) : (
          <Search aria-hidden="true" className="size-5 text-muted" />
        )}
        <Cmdk.Input
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            if (asking) setAsking(false);
          }}
          placeholder={t('palette.placeholder')}
          className="h-14 flex-1 bg-transparent text-base text-text outline-none placeholder:text-muted"
        />
      </div>

      {/* The list stays mounted while the answer shows: the input's aria-controls points at it. */}
      <Cmdk.List className={asking ? 'hidden' : 'max-h-[min(26rem,60dvh)] overflow-y-auto p-2'}>
        {!asking && (
          <>
            {query.trim() && (
              <Cmdk.Group heading={t('palette.groups.assistant')} forceMount>
                <Cmdk.Item
                  value={`ask ${query}`}
                  forceMount
                  onSelect={askAssistant}
                  className={item}
                >
                  <Sparkles aria-hidden="true" className="size-4 text-primary" />
                  {t('palette.ask', { query: query.trim() })}
                </Cmdk.Item>
              </Cmdk.Group>
            )}
            <SearchResults
              query={query}
              className={item}
              onOpen={(href) => {
                void navigate(href);
                close(false);
              }}
            />
            {GROUPS.map((group) => (
              <Cmdk.Group key={group} heading={t(`palette.groups.${group}`)}>
                {commands
                  .filter((command) => command.group === group)
                  .map((command) => {
                    const Icon = command.icon;
                    return (
                      <Cmdk.Item
                        key={command.id}
                        value={command.id}
                        keywords={[command.label, ...(command.keywords ?? [])]}
                        onSelect={() => {
                          run(command);
                        }}
                        className={item}
                      >
                        <Icon aria-hidden="true" className="size-4 text-muted" />
                        {command.label}
                      </Cmdk.Item>
                    );
                  })}
              </Cmdk.Group>
            ))}
          </>
        )}
      </Cmdk.List>
      {asking && (
        <AssistantPanel
          run={ask.data}
          pending={ask.isPending}
          error={ask.error}
          onRetry={askAssistant}
          onClose={() => {
            close(false);
          }}
        />
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2">
        <AiStatus />
        <span className="hidden gap-3 text-xs text-muted sm:flex">
          <span>
            <kbd className="font-sans">↑↓</kbd> {t('palette.hint.move')}
          </span>
          <span>
            <kbd className="font-sans">↵</kbd> {t('palette.hint.select')}
          </span>
          <span>
            <kbd className="font-sans">esc</kbd> {t('palette.hint.close')}
          </span>
        </span>
      </div>
    </Cmdk.Dialog>
  );
}
