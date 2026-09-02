import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Standard PointX quick tabs bar
 */
export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, className = '' }) => {
  return (
    <div className={cn('flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)] font-sans', className)}>
      {items.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeId === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all select-none cursor-pointer',
              isActive
                ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent'
            )}
          >
            {Icon && <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]')} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-mono font-bold',
                  isActive
                    ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Radix Primitives for headless & complex tabs
export const RadixTabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-11 items-center justify-center rounded-xl bg-[var(--bg-surface-inset)] p-1 text-[var(--text-secondary)] border border-[var(--border-subtle)]',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[var(--bg-surface-raised)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-xs data-[state=active]:border data-[state=active]:border-[var(--border-subtle)]',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
