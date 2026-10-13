import { CircleAlert } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { ItemsData, WidgetView } from '@/core/dashboard/queries';
import { useFeedText } from '@/core/modules/feed-text';
import { textFor } from '@/core/modules/module-text';
import { useModuleRegistry } from '@/core/modules/registry';
import { cx } from '@/core/utils/cx';
import { SeriesChart } from '@/platform/dashboard/series-chart';
import { StatTile } from '@/platform/dashboard/stat-tile';
import { FeedRow } from '@/platform/feed/feed-row';

type LooseT = (key: string, options?: Record<string, unknown>) => string;

/** A module names its own widgets in its manifest; platform widgets are named in common.json. */
function useWidgetTitle(widget: WidgetView): { title: string; module: string | null } {
  const { t, i18n } = useTranslation();
  const registry = useModuleRegistry();
  if (registry.has(widget.owner)) {
    const text = textFor(registry.definitionFor(widget.owner), i18n.language);
    return { title: text.widgets?.[widget.key] ?? widget.key, module: text.name };
  }
  const title = (t as unknown as LooseT)(`dashboard.widgets.${widget.key}`, {
    defaultValue: widget.key,
  });
  return { title, module: null };
}

function ItemList({ data }: { data: ItemsData }) {
  const { t } = useTranslation();
  const feedText = useFeedText();
  if (data.items.length === 0) {
    return <p className="text-sm text-muted">{t('dashboard.emptyList')}</p>;
  }
  return (
    <ul role="list" className="divide-y divide-border">
      {data.items.map((item, index) => (
        <FeedRow
          // Entries carry no id; the list is replaced as a whole on every load.
          key={index}
          at={item.at}
          text={item.title ?? feedText(item.code ?? '', item.params ?? {})}
        />
      ))}
    </ul>
  );
}

/** One dashboard widget: its title, and its data drawn for its kind (or an honest failure). */
export function WidgetCard({ widget, days }: { widget: WidgetView; days: number }) {
  const { t } = useTranslation();
  const headingId = useId();
  const { title, module } = useWidgetTitle(widget);
  const data = widget.data;

  return (
    <section
      aria-labelledby={headingId}
      className={cx(
        'rounded-3xl border border-border bg-glass p-5 shadow-sm backdrop-blur-xl',
        widget.kind === 'series' && 'lg:col-span-2',
      )}
    >
      <h2 id={headingId} className="mb-3 text-sm font-medium text-muted">
        {module && (
          <>
            <span className="text-text">{module}</span>
            {' · '}
          </>
        )}
        {title}
      </h2>
      {data === null ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {t('dashboard.widgetFailed')}
        </p>
      ) : data.kind === 'kpi' ? (
        <StatTile data={data} days={days} />
      ) : data.kind === 'series' ? (
        <SeriesChart data={data} title={title} />
      ) : (
        <ItemList data={data} />
      )}
    </section>
  );
}
