import { useState } from 'react';

import { Button } from '@/design-system/primitives/button';
import { TextField, type TextFieldProps } from '@/design-system/primitives/text-field';

export interface PasswordFieldProps extends Omit<TextFieldProps, 'type' | 'action'> {
  showLabel: string;
  hideLabel: string;
}

/** Password input with an accessible show/hide toggle (aria-pressed). */
export function PasswordField({ showLabel, hideLabel, ...field }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...field}
      type={visible ? 'text' : 'password'}
      action={
        <Button
          variant="ghost"
          aria-pressed={visible}
          onClick={() => {
            setVisible((current) => !current);
          }}
        >
          {visible ? hideLabel : showLabel}
        </Button>
      }
    />
  );
}
