import { useTranslation } from 'react-i18next';

import { useAskAgent, type ClientAction } from '@/core/agents/queries';
import { env } from '@/core/config/env';
import { toLanguage } from '@/core/i18n';
import { NS } from '@/modules/expenses/i18n';

/** The assistant skill that looks for one thing under several names, and its client tool. */
const SKILL = 'tidy-products';
export const MATCH_TOOL = 'expenses_product_matches';

/** Products and titles suggested as the same thing as one product, for the user to confirm. */
export interface Match {
  key: string;
  product_id: string;
  products: string[];
  titles: string[];
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/** Matches out of a client action's arguments. They come from an AI model or the rules, so
 *  their shape is checked, and a match with nothing to combine is dropped. */
export function matchesFrom(action: ClientAction | undefined): Match[] {
  const raw: unknown = action?.tool === MATCH_TOOL ? action.arguments.matches : undefined;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      key: crypto.randomUUID(),
      product_id: typeof item.product_id === 'string' ? item.product_id : '',
      products: strings(item.products),
      titles: strings(item.titles),
    }))
    .filter((match) => match.product_id && (match.products.length || match.titles.length));
}

/** Ask the assistant to look for products followed under more than one name. */
export function useFindMatches() {
  const { t, i18n } = useTranslation(NS);
  const ask = useAskAgent(env.assistantAgent);
  return {
    run: ask.data,
    error: ask.error,
    pending: ask.isPending,
    find: () =>
      ask.mutateAsync({
        input: t('prices.findPrompt'),
        skill: SKILL,
        locale: toLanguage(i18n.language),
      }),
  };
}
