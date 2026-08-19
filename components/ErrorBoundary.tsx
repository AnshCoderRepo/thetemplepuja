"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional fallback UI — when omitted, a styled error card is shown. */
  fallback?: ReactNode;
  /** Called when an error is caught (for logging, analytics, etc.). */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches rendering errors anywhere in the component tree and displays a
 * friendly fallback instead of crashing the whole page. Usage:
 *
 * ```tsx
 * <ErrorBoundary>
 *   <SomeRiskyComponent />
 * </ErrorBoundary>
 * ```
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    // In production, send to an error reporting service (Sentry, etc.)
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="mx-auto my-8 max-w-md rounded-3xl border border-saffron-100 bg-white p-8 text-center shadow-card">
          <span className="text-4xl">⚠️</span>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            An unexpected error occurred. You can try again or reload the page.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-red-50 p-3 text-left text-[11px] text-red-700">
              {this.state.error.message}
              {"\n"}
              {this.state.error.stack}
            </pre>
          )}
          <button onClick={this.handleRetry} className="btn-primary mt-6">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
