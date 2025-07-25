import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check for specific Supabase/database errors
    if (error.message?.includes('schema') || error.message?.includes('Database error')) {
      console.error('Database schema error detected:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }

    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const isSchemaError = this.state.error?.message?.includes('schema') || 
                           this.state.error?.message?.includes('Database error');

      return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8fafb] to-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full space-y-4">
            <Alert variant="destructive" className="border-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-lg font-semibold">
                {isSchemaError ? 'Database Configuration Error' : 'Something went wrong'}
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                {isSchemaError ? (
                  <>
                    <p>
                      The application encountered a database access error. This usually happens when:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>The database permissions are not configured correctly</li>
                      <li>Required tables or columns are missing</li>
                      <li>The Supabase client is trying to access admin-only features</li>
                    </ul>
                    <p className="mt-2 font-medium">
                      Error: {this.state.error?.message}
                    </p>
                  </>
                ) : (
                  <p>An unexpected error occurred. Please try refreshing the page.</p>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button onClick={this.handleReset} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
              >
                Go to Home
              </Button>
            </div>

            {/* Development mode: show error details */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer font-medium">Error Details (Development Only)</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}