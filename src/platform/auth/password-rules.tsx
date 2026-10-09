import { useTranslation } from 'react-i18next';

import { passwordViolations, type PasswordPolicy } from '@/core/auth/password-policy';
import { cx } from '@/core/utils/cx';

/** Live checklist of the password policy; each rule says whether it is met. */
export function PasswordRules({ password, policy }: { password: string; policy: PasswordPolicy }) {
  const { t } = useTranslation();
  const broken = new Set(passwordViolations(password, policy));
  const rules = [
    { id: 'too_short', text: t('auth.rules.too_short', { count: policy.min_length }) },
    { id: 'too_simple', text: t('auth.rules.too_simple', { count: policy.min_classes }) },
    { id: 'surrounding_whitespace', text: t('auth.rules.surrounding_whitespace') },
  ] as const;

  return (
    <div>
      <p>{t('auth.rules.title')}</p>
      <ul className="mt-1 space-y-0.5">
        {rules.map((rule) => {
          const met = password.length > 0 && !broken.has(rule.id);
          return (
            <li key={rule.id} className={cx(met ? 'text-success' : 'text-muted')}>
              <span aria-hidden="true">{met ? '✓ ' : '• '}</span>
              {rule.text}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
