import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { PointXLogo } from './PointXLogo';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PointX Uncaught Client Exception]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#080A10] text-slate-100 flex flex-col items-center justify-center p-6 font-sans select-none">
          <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl text-center flex flex-col items-center">
            <div className="mb-5">
              <PointXLogo className="h-8 w-auto" forceTheme="dark" />
            </div>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg">
              <AlertTriangle className="w-7 h-7 animate-pulse" />
            </div>

            <h1 className="text-xl font-bold text-white mb-2 font-display">
              Interface Render Issue
            </h1>
            <p className="text-xs text-slate-400 mb-6 font-mono leading-relaxed">
              PointX encountered an unexpected client display error. Your data and account remain completely safe.
            </p>

            {this.state.error && (
              <div className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-rose-400 text-left overflow-x-auto mb-6 max-h-24 no-scrollbar">
                {this.state.error.message || 'Unknown render exception'}
              </div>
            )}

            <div className="flex flex-col w-full gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cache & Restart</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
