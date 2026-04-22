import React, { Component, ErrorInfo, ReactNode } from "react";
import { errorReporting } from "@/services/errorReportingService";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * React Error Boundary component
 * Catches React component errors and reports them to the error reporting service
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("React Error Boundary caught an error:", error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Report to error reporting service
    errorReporting.reportError({
      errorMessage: error.message,
      errorStack: error.stack,
      errorType: "react",
      severity: "error",
      componentStack: errorInfo.componentStack,
      additionalData: {
        errorName: error.name,
      },
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
          <Card className="max-w-2xl w-full p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Something went wrong
                </h2>
                <p className="text-muted-foreground mb-4">
                  We encountered an unexpected error. The error has been automatically reported to our team.
                </p>

                {process.env.NODE_ENV === "development" && this.state.error && (
                  <div className="mb-4">
                    <details className="mb-2">
                      <summary className="cursor-pointer text-sm font-medium text-foreground hover:text-primary">
                        Error Details (Development Only)
                      </summary>
                      <div className="mt-2 p-4 bg-muted rounded-lg">
                        <p className="text-sm font-mono text-destructive mb-2">
                          {this.state.error.message}
                        </p>
                        {this.state.error.stack && (
                          <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                            {this.state.error.stack}
                          </pre>
                        )}
                      </div>
                    </details>
                    {this.state.errorInfo?.componentStack && (
                      <details>
                        <summary className="cursor-pointer text-sm font-medium text-foreground hover:text-primary">
                          Component Stack
                        </summary>
                        <div className="mt-2 p-4 bg-muted rounded-lg">
                          <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={this.handleReload} variant="default">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>
                  <Button onClick={this.handleReset} variant="outline">
                    Try Again
                  </Button>
                  <Link href="/dashboard">
                    <Button variant="outline">
                      <Home className="w-4 h-4 mr-2" />
                      Go Home
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}