import { Component, ErrorInfo, ReactNode } from 'react';

import Logo from '@assets/forky_logo.png';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export function ErrorBoundaryFallback() {
  return (
    <div className="flex h-dvh w-screen flex-col items-center justify-center bg-shell">
      <img src={Logo} className="size-72 rotate-180 object-contain" />
      <h1 className="mt-8 font-mono text-base uppercase tracking-widest text-danger-accent">
        Uhh... Something went wrong
      </h1>
    </div>
  );
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <ErrorBoundaryFallback />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
