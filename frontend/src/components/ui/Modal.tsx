import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalBackdropVariants, modalDialogVariants } from '../animation/motionTokens';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg'
}) => {
  const [mounted] = useState(() => typeof document !== 'undefined');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const maxWidthStyles = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl'
  }[maxWidth];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
          {/* Full-Viewport Backdrop covering 100% of the screen */}
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal / Bottom Sheet Container with Smooth Spring Entrance */}
          <motion.div
            variants={modalDialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative z-10 w-full ${maxWidthStyles} rounded-t-3xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-floating)] overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[90vh]`}
          >
            {/* Mobile Swipe / Drag Indicator */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1.5 w-12 rounded-full bg-[var(--border-strong)] opacity-60" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between px-5 pt-3 sm:pt-5 pb-4 border-b border-[var(--border-subtle)] shrink-0">
                <div className="min-w-0 pr-2">
                  {title && <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight font-display">{title}</h3>}
                  {description && <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed truncate sm:whitespace-normal">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] shadow-sm active:shadow-inner transition-all cursor-pointer shrink-0"
                  title="Close popup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto text-sm sm:text-base flex-1 flex flex-col">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};