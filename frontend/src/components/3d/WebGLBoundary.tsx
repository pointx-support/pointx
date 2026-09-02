import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export interface WebGLFallbackProps {
  title?: string;
  message?: string;
  className?: string;
  onRetry?: () => void;
}

export const WebGLFallback: React.FC<WebGLFallbackProps> = ({
  title = '3D Canvas Unavailable',
  message = 'Your browser or graphics hardware does not currently support WebGL hardware acceleration.',
  className,
  onRetry,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] min-h-[300px]',
        className
      )}
    >
      <div className="p-3 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-[var(--accent-primary)] mb-4">
        <Box className="h-8 w-8" />
      </div>
      <h4 className="text-base font-bold text-[var(--text-primary)] mb-1 font-display">{title}</h4>
      <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Loading Scene</span>
        </button>
      )}
    </div>
  );
};

interface WebGLBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface WebGLBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WebGLBoundary extends Component<WebGLBoundaryProps, WebGLBoundaryState> {
  constructor(props: WebGLBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WebGLBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[WebGLBoundary] 3D rendering context error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError || !isWebGLAvailable()) {
      return (
        this.props.fallback || (
          <WebGLFallback
            title="3D Scene Error"
            message={this.state.error?.message || 'Failed to initialize WebGL context.'}
            onRetry={this.handleRetry}
          />
        )
      );
    }

    return this.props.children;
  }
}
