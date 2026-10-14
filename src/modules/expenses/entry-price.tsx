import { ArrowRight, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { Button, toast } from '@/design-system';
import { useProducts, useTrackProduct, useUnits, type Entry } from '@/modules/expenses/api';
import { NS } from '@/modules/expenses/i18n';
import { paths } from '@/modules/expenses/paths';
import { priceUnitFor, unitPrice, useUnitText } from '@/modules/expenses/units';

/** For something bought: how much, what that comes to per unit, and the price history of
 *  what it is (or a way to start following it). */
export function EntryPrice({ entry }: { entry: Entry }) {
  const { t } = useTranslation(NS);
  const navigate = useNavigate();
  const products = useProducts(entry.title);
  const track = useTrackProduct();
  const units = useUnits().data ?? [];
  const text = useUnitText();
  if (entry.kind !== 'expense' || entry.deleted) return null;

  const product = products.data?.[0];
  const per = product?.price_unit ?? (entry.unit ? priceUnitFor(units, entry.unit) : null);
  const each =
    entry.quantity && entry.unit && per
      ? unitPrice(units, entry.amount_minor, entry.quantity, entry.unit, per)
      : null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-bg/70 px-4 py-3">
      <TrendingUp aria-hidden="true" className="size-5 shrink-0 text-chart" />
      <p className="min-w-40 flex-1 text-sm">
        {!entry.quantity || !entry.unit
          ? t('track.prompt')
          : each !== null && per
            ? t('track.bought', {
                quantity: text.quantity(entry.quantity, entry.unit),
                price: text.perUnit(each, entry.currency, per),
              })
            : t('track.boughtOnly', { quantity: text.quantity(entry.quantity, entry.unit) })}
      </p>
      {product ? (
        <Link
          to={paths.product(product.id)}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          {t('track.history', { name: product.name })}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        products.isSuccess && (
          <Button
            variant="secondary"
            disabled={track.isPending}
            onClick={() => {
              track.mutate(entry.title, {
                onSuccess: (followed) => {
                  toast(t('track.done', { title: followed.name }), { tone: 'success' });
                  void navigate(paths.product(followed.id));
                },
              });
            }}
          >
            {t('track.button')}
          </Button>
        )
      )}
    </div>
  );
}
