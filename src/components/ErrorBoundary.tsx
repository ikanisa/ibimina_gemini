import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { clearAllAppCachesAndReload } from '../lib/pwa';
import { captureError } from '../lib/sentry';

// ============================================================================
// ERROR BOUNDARY COMPONENT
// Catches JavaScript errors anywhere in child component tree
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: 'network' | 'auth' | 'render' | 'unknown';
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Categorize error type
    let errorType: State['errorType'] = 'unknown';
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      errorType = 'network';
    } else if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
      errorType = 'auth';
    } else {
      errorType = 'render';
    }

    return { hasError: true, error, errorType };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send to Sentry in production
    captureError(error, {
      componentStack: errorInfo.componentStack,
      errorType: this.state.errorType,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-md w-full p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="text-red-600" size={32} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h1>

            <p className="text-slate-600 mb-6">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-slate-100 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-600 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs text-slate-500 mt-2 overflow-auto max-h-32">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <RefreshCw size={18} />
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Reload Page
              </button>

              <button
                onClick={() => clearAllAppCachesAndReload()}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Clear cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
