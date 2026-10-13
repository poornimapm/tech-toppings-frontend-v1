import { useTranslation } from 'react-i18next';

import { ACCENTS, type ModuleAccent } from '@/core/modules/types';
import { useCategories, type Category } from '@/modules/expenses/api';
import { NS } from '@/modules/expenses/i18n';

/** System category names are translated by key; that key set is only known at runtime. */
type LooseT = (key: string, options?: Record<string, unknown>) => string;

/** An accent for a new category, steady for a given name. */
export function accentFor(name: string): ModuleAccent {
  let sum = 0;
  for (const letter of name) sum += letter.codePointAt(0) ?? 0;
  return ACCENTS[sum % ACCENTS.length] ?? 'slate';
}

/** Categories by id, with their names in the user's language. */
export function useCategoryBook() {
  const { t } = useTranslation(NS);
  const categories = useCategories().data ?? [];
  const byId = new Map(categories.map((category) => [category.id, category]));
  const nameOf = (category: Category | undefined): string => {
    if (!category) return t('categories.unknown');
    if (category.name) return category.name;
    return (t as unknown as LooseT)(`categories.system.${category.key ?? ''}`, {
      defaultValue: category.key ?? category.id,
    });
  };
  return { categories, find: (id: string) => byId.get(id), nameOf };
}
