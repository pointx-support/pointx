import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastToastRef = React.useRef<{ key: string; time: number } | null>(null);

  const showToast = useCallback(({ type, title, message }: Omit<Toast, 'id'>) => {
    const key = `${type}:${title}:${message || ''}`;
    const now = Date.now();
    if (lastToastRef.current && lastToastRef.current.key === key && now - lastToastRef.current.time < 800) {
      return;
    }
    lastToastRef.current = { key, time: now };

    const id = `toast-${now}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => {
      if (prev.some((t) => t.type === type && t.title === title && t.message === message)) {
        return prev;
      }
      return [...prev, { id, type, title, message }];
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Viewport */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none font-sans">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-floating)] animate-fadeIn transition-all"
          >
            <div className="flex items-start gap-3">
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-[var(--status-live)] shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-[var(--status-danger)] shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-[var(--accent-primary)] shrink-0 mt-0.5" />}
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)] tracking-wide font-display">{toast.title}</div>
                {toast.message && <div className="text-xs sm:text-[13px] text-[var(--text-secondary)] mt-0.5 leading-snug">{toast.message}</div>}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: ({ title, message }: Omit<Toast, 'id'>) => {
        console.log(`[Toast]: ${title} - ${message || ''}`);
      }
    };
  }
  return context;
};
