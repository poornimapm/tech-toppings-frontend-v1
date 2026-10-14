// Shared UI primitives. Modules import UI only from here (ADR-0001).
export { niceMax, niceRange, useMeasuredWidth } from '@/design-system/charts/scale';
export { MotionProvider } from '@/design-system/motion/motion-provider';
export { Alert, type AlertTone } from '@/design-system/primitives/alert';
export {
  AnimatedNumber,
  type AnimatedNumberProps,
} from '@/design-system/primitives/animated-number';
export { Badge, type BadgeTone } from '@/design-system/primitives/badge';
export { Button, type ButtonProps, type ButtonVariant } from '@/design-system/primitives/button';
export { Card, type CardProps } from '@/design-system/primitives/card';
export { Dialog, type DialogProps } from '@/design-system/primitives/dialog';
export { EmptyState, type EmptyStateProps } from '@/design-system/primitives/empty-state';
export {
  FilterChips,
  type FilterChip,
  type FilterChipsProps,
} from '@/design-system/primitives/filter-chips';
export { LoadError } from '@/design-system/primitives/load-error';
export { PasswordField, type PasswordFieldProps } from '@/design-system/primitives/password-field';
export { SearchField, type SearchFieldProps } from '@/design-system/primitives/search-field';
export {
  SelectField,
  type SelectFieldProps,
  type SelectOption,
} from '@/design-system/primitives/select-field';
export { Skeleton } from '@/design-system/primitives/skeleton';
export { Switch, type SwitchProps } from '@/design-system/primitives/switch';
export { TextField, type TextFieldProps } from '@/design-system/primitives/text-field';
export { toast, useToasts, type ToastOptions } from '@/design-system/primitives/toast-store';
export { Toaster } from '@/design-system/primitives/toaster';
export { usePointerTilt } from '@/design-system/primitives/use-pointer-tilt';
