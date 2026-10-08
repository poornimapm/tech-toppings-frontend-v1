import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorFallback } from '@/platform/shell/error-fallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Last-resort boundary for failures outside the router (providers, router setup). */
export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('Unhandled render error', error, info.componentStack);
  }

  override render(): ReactNode {
    return this.state.hasError ? <ErrorFallback /> : this.props.children;
  }
}
