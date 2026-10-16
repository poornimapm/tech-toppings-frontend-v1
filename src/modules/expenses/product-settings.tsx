import { BellRing, Combine, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { errorKey } from '@/core/i18n';
import { toInput, toMinor } from '@/core/utils/money';
import { Alert, Button, SelectField, TextField, toast } from '@/design-system';
import {
  failureCode,
  useMergeProduct,
  useProducts,
  useStopProduct,
  useUnits,
  useUpdateProduct,
  type ProductDetail,
  type ProductPatch,
} from '@/modules/expenses/api';
import { CONFIRM_TRIGGER, useConfirmFocus } from '@/modules/expenses/confirm-focus';
import { NS } from '@/modules/expenses/i18n';
import { paths } from '@/modules/expenses/paths';
import { useUnitText } from '@/modules/expenses/units';

const SECTION = 'space-y-2 border-t border-border pt-4 first:border-t-0 first:pt-0';

/** Run `handler` for a form without the page reloading. */
const onSubmit = (handler: () => void) => (event: { preventDefault: () => void }) => {
  event.preventDefault();
  handler();
};

/** What the user can change about a product: its alert, price unit, names, and whether it
 *  stays a product of its own. */
export function ProductSettings({ product }: { product: ProductDetail }) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const navigate = useNavigate();
  const units = useUnitText();
  const unitTable = useUnits().data ?? [];
  const others = (useProducts().data ?? []).filter((item) => item.id !== product.id);
  const update = useUpdateProduct();
  const merge = useMergeProduct();
  const stop = useStopProduct();
  const [limit, setLimit] = useState(
    product.alert_above_minor ? toInput(product.alert_above_minor, product.currency) : '',
  );
  const [name, setName] = useState(product.name);
  const [alias, setAlias] = useState('');
  const [other, setOther] = useState('');
  const [stopping, setStopping] = useState(false);
  const stopRef = useConfirmFocus<HTMLDivElement>(stopping);
  const failure = failureCode(update.error);
  const perUnit = units.name(product.price_unit);

  function change(
    body: ProductPatch,
    done: 'product.alert.set' | 'product.alert.cleared' | 'product.saved' | 'product.names.saved',
  ) {
    update.mutate(
      { id: product.id, body },
      { onSuccess: () => toast(t(done, { name: product.name }), { tone: 'success' }) },
    );
  }

  const limitMinor = toMinor(limit, product.currency);
  return (
    <section
      aria-labelledby="settings-title"
      className="space-y-4 rounded-3xl border border-border bg-glass p-5 shadow-sm backdrop-blur-xl"
    >
      <h2 id="settings-title" className="text-lg font-semibold">
        {t('product.settings')}
      </h2>
      {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}

      <form
        className={SECTION}
        onSubmit={onSubmit(() => {
          if (limitMinor) change({ alert_above_minor: limitMinor }, 'product.alert.set');
        })}
      >
        <h3 className="flex items-center gap-2 font-medium">
          <BellRing aria-hidden="true" className="size-4" />
          {t('product.alert.title')}
        </h3>
        <div className="flex flex-wrap items-end gap-2">
          <TextField
            label={t('product.alert.label', { currency: product.currency, unit: perUnit })}
            inputMode="decimal"
            autoComplete="off"
            value={limit}
            onChange={(event) => {
              setLimit(event.target.value);
            }}
            className="min-w-48 flex-1"
          />
          <Button type="submit" disabled={!limitMinor || update.isPending}>
            {t('product.alert.save')}
          </Button>
          {product.alert_above_minor !== null && (
            <Button
              variant="secondary"
              disabled={update.isPending}
              onClick={() => {
                setLimit('');
                change({ alert_above_minor: null }, 'product.alert.cleared');
              }}
            >
              {t('product.alert.off')}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted">
          {product.alert_above_minor === null
            ? t('product.alert.hint')
            : t('product.alert.on', {
                price: units.perUnit(
                  product.alert_above_minor,
                  product.currency,
                  product.price_unit,
                ),
              })}
        </p>
      </form>

      <div className={SECTION}>
        <SelectField
          label={t('product.priceUnit')}
          value={product.price_unit}
          options={unitTable
            .filter((unit) => unit.dimension === product.dimension)
            .map((unit) => ({ value: unit.code, label: units.name(unit.code) }))}
          onChange={(event) => {
            change({ price_unit: event.target.value }, 'product.saved');
          }}
        />
      </div>

      <form
        className={SECTION}
        onSubmit={onSubmit(() => {
          if (alias.trim()) {
            change({ aliases: [...product.aliases, alias.trim()] }, 'product.names.saved');
            setAlias('');
          }
        })}
      >
        <h3 className="font-medium">{t('product.names.title')}</h3>
        <p className="text-sm text-muted">{t('product.names.hint', { name: product.name })}</p>
        <ul role="list" className="flex flex-wrap gap-2">
          {product.aliases.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface py-0.5 pr-1 pl-3 text-sm"
            >
              {item}
              <button
                type="button"
                aria-label={t('product.names.remove', { name: item })}
                disabled={product.aliases.length === 1 || update.isPending}
                onClick={() => {
                  const kept = product.aliases.filter((value) => value !== item);
                  change({ aliases: kept }, 'product.names.saved');
                }}
                className="inline-flex size-6 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-end gap-2">
          <TextField
            label={t('product.names.add')}
            maxLength={120}
            value={alias}
            onChange={(event) => {
              setAlias(event.target.value);
            }}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={!alias.trim() || update.isPending}>
            <Plus aria-hidden="true" className="size-4" />
            {t('product.names.addButton')}
          </Button>
        </div>
      </form>

      <form
        className={SECTION}
        onSubmit={onSubmit(() => {
          if (name.trim() && name.trim() !== product.name) {
            change({ name: name.trim() }, 'product.saved');
          }
        })}
      >
        <div className="flex items-end gap-2">
          <TextField
            label={t('product.rename')}
            maxLength={120}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={update.isPending}>
            {t('product.save')}
          </Button>
        </div>
      </form>

      {others.length > 0 && (
        <form
          className={SECTION}
          onSubmit={onSubmit(() => {
            const chosen = others.find((item) => item.id === other);
            if (!chosen) return;
            merge.mutate(
              { id: product.id, other: chosen.id },
              {
                onSuccess: () => {
                  toast(t('product.combine.done', { other: chosen.name, name: product.name }), {
                    tone: 'success',
                  });
                  setOther('');
                },
              },
            );
          })}
        >
          <h3 className="font-medium">{t('product.combine.title')}</h3>
          <p className="text-sm text-muted">{t('product.combine.hint', { name: product.name })}</p>
          <div className="flex items-end gap-2">
            <SelectField
              label={t('product.combine.choose')}
              placeholder={t('product.combine.none')}
              value={other}
              options={others.map((item) => ({ value: item.id, label: item.name }))}
              onChange={(event) => {
                setOther(event.target.value);
              }}
              className="flex-1"
            />
            <Button type="submit" variant="secondary" disabled={!other || merge.isPending}>
              <Combine aria-hidden="true" className="size-4" />
              {t('product.combine.button')}
            </Button>
          </div>
        </form>
      )}

      <div ref={stopRef} className={SECTION}>
        {stopping ? (
          <div role="alert" className="flex flex-wrap items-center gap-2">
            <p className="flex-1 text-sm">{t('product.stop.confirm', { name: product.name })}</p>
            <Button
              variant="secondary"
              onClick={() => {
                setStopping(false);
              }}
            >
              {t('product.stop.no')}
            </Button>
            <Button
              disabled={stop.isPending}
              onClick={() => {
                stop.mutate(product.id, {
                  onSuccess: () => {
                    toast(t('product.stop.done', { name: product.name }), { tone: 'success' });
                    void navigate(paths.prices);
                  },
                });
              }}
            >
              {t('product.stop.yes')}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            {...CONFIRM_TRIGGER}
            onClick={() => {
              setStopping(true);
            }}
          >
            {t('product.stop.button')}
          </Button>
        )}
      </div>
    </section>
  );
}
