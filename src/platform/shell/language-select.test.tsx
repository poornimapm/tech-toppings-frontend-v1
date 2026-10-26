import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import i18n, { languageFiles } from '@/core/i18n';
import { useToasts } from '@/design-system';
import { LanguageSelect } from '@/platform/shell/language-select';

const TAMIL = './locales/ta/common.json';
const real = { ...languageFiles };

afterEach(() => {
  Object.assign(languageFiles, real);
});

describe('the language select', () => {
  it('shows English after a failed download, so choosing the language again retries it', async () => {
    i18n.addResourceBundle('ta', 'demo', { title: 'மாதிரி' }); // a module page's own texts
    languageFiles[TAMIL] = () => Promise.reject(new Error('offline'));
    const user = userEvent.setup();
    render(<LanguageSelect />);
    const select = screen.getByRole('combobox', { name: 'Language' });

    await user.selectOptions(select, 'ta');
    await waitFor(() => {
      expect(useToasts.getState().toasts).toHaveLength(1); // after i18next's own retries
    });
    expect(select).toHaveValue('en'); // the language actually shown

    Object.assign(languageFiles, real);
    await user.selectOptions(select, 'ta');

    await waitFor(() => {
      expect(select).toHaveValue('ta');
    });
    expect(document.documentElement.lang).toBe('ta');
  });
});
