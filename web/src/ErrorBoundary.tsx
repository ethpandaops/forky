import { Component, ErrorInfo, ReactNode } from 'react';

import Logo from '@assets/forky_logo.png';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
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
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-stone-900">
          <img src={Logo} className="object-contain w-72 h-72 rotate-180" />
          <h1 className="mt-6 text-2xl text-rose-400">Uhh... Something went wrong</h1>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
