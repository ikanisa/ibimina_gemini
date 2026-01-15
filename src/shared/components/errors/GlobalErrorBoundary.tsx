import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorPage } from './ErrorPage';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary
 * Catch-all for unhandled exceptions in the React tree.
 * Displays a friendly "Soft Liquid Glass" UI instead of a white screen.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <ErrorPage
                    error={this.state.error || undefined}
                    resetErrorBoundary={this.handleReset}
                    title="Something went wrong"
                    message="We encountered an unexpected error. Please try reloading the page. If the issue persists, contact support."
                    showGoBack={false}
                    showGoHome={true}
                />
            );
        }

        return this.props.children;
    }
}

