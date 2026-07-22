import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State;
  public declare props: Props;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.removeItem('freshlink_cached_user');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-white dark:bg-stone-900 p-8 max-w-md w-full rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-stone-100 uppercase tracking-tight">Something went wrong</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-2 leading-relaxed">
              An application error occurred while rendering this page.
            </p>
            {this.state.error && (
              <div className="bg-stone-100 dark:bg-stone-850 p-3 rounded-xl mt-4 text-left overflow-auto max-h-32">
                <code className="text-[10px] text-red-600 dark:text-red-400 font-mono break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Reload Application
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl hover:bg-stone-300 dark:hover:bg-stone-700 transition-all cursor-pointer"
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
