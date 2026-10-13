import { Archive } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { errorKey } from '@/core/i18n';
import { Alert, Badge, Button, Dialog, FilterChips, TextField } from '@/design-system';
import {
  failureCode,
  useAddCategory,
  useArchiveCategory,
  type EntryKind,
} from '@/modules/expenses/api';
import { accentFor, useCategoryBook } from '@/modules/expenses/category-book';
import { CategoryIcon } from '@/modules/expenses/category-icon';
import { NS } from '@/modules/expenses/i18n';

const KINDS = ['expense', 'income'] as const satisfies readonly EntryKind[];
const DEFAULT_ICON = '🏷️';

/** The user's own categories: add one (a name and an emoji is all it takes) or archive one.
 *  An archived category stays on the entries already filed under it. */
export function CategoriesDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const book = useCategoryBook();
  const add = useAddCategory();
  const archive = useArchiveCategory();
  const [kind, setKind] = useState<EntryKind>('expense');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const mine = book.categories.filter((category) => !category.system && category.kind === kind);
  const failure = failureCode(add.error);

  function submit(event: SyntheticEvent) {
    event.preventDefault();
    const wanted = name.trim();
    if (!wanted) return;
    add.mutate(
      { kind, name: wanted, icon: icon.trim() || DEFAULT_ICON, accent: accentFor(wanted) },
      {
        onSuccess: () => {
          setName('');
          setIcon('');
        },
      },
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('categories.title')}
      description={t('categories.hint')}
    >
      <div className="space-y-4">
        <FilterChips
          label={t('form.kind')}
          value={kind}
          chips={KINDS.map((value) => ({ value, label: t(`kind.${value}`) }))}
          onChange={setKind}
        />
        {mine.length === 0 ? (
          <p className="text-sm text-muted">{t('categories.empty')}</p>
        ) : (
          <ul role="list" className="divide-y divide-border">
            {mine.map((category) => (
              <li key={category.id} className="flex items-center gap-3 py-2">
                <CategoryIcon category={category} className="size-9 text-base" />
                <span className="min-w-0 flex-1 truncate">{category.name}</span>
                {category.archived ? (
                  <Badge>{t('categories.archived')}</Badge>
                ) : (
                  <Button
                    variant="ghost"
                    aria-label={t('categories.archive', { name: category.name ?? '' })}
                    disabled={archive.isPending}
                    onClick={() => {
                      archive.mutate(category.id);
                    }}
                  >
                    <Archive aria-hidden="true" className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <form noValidate className="space-y-3" onSubmit={submit}>
          {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
          <div className="grid grid-cols-[1fr_5.5rem] gap-3">
            <TextField
              label={t('categories.name')}
              maxLength={40}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
            <TextField
              label={t('categories.icon')}
              maxLength={16}
              placeholder={DEFAULT_ICON}
              value={icon}
              onChange={(event) => {
                setIcon(event.target.value);
              }}
            />
          </div>
          <Button type="submit" className="w-full" disabled={add.isPending || !name.trim()}>
            {t('categories.add')}
          </Button>
        </form>
      </div>
    </Dialog>
  );
}
