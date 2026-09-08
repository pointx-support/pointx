import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Check, Building2, Mail, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export interface OrganizationOption {
  id: string;
  name: string;
  email: string;
  logoUrl?: string;
}

export interface OrganizationSuggestPickerProps {
  selectedOrgIds: string[];
  onChange: (selectedIds: string[]) => void;
  organizations?: OrganizationOption[];
  onSearchServer?: (query: string) => Promise<OrganizationOption[]>;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Highlights matches of query within text using safe string slicing
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <span>{text}</span>;
  const q = query.trim().toLowerCase();
  const lower = text.toLowerCase();
  const index = lower.indexOf(q);
  if (index === -1) return <span>{text}</span>;

  const before = text.slice(0, index);
  const match = text.slice(index, index + q.length);
  const after = text.slice(index + q.length);

  return (
    <span>
      {before}
      <mark className="bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] font-black px-0.5 rounded">
        {match}
      </mark>
      {after}
    </span>
  );
}

/**
 * Avatar with image or initials fallback
 */
function OrgAvatar({ org }: { org: OrganizationOption }) {
  const [hasError, setHasError] = useState(false);

  const initials = useMemo(() => {
    const parts = (org.name || 'Org').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (org.name || 'OR').slice(0, 2).toUpperCase();
  }, [org.name]);

  if (org.logoUrl && !hasError) {
    return (
      <img
        src={org.logoUrl}
        alt={org.name}
        onError={() => setHasError(true)}
        className="w-7 h-7 rounded-lg object-cover border border-[var(--border-subtle)] shrink-0 bg-black/40"
      />
    );
  }

  return (
    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300 font-mono shrink-0 shadow-xs">
      {initials}
    </div>
  );
}

export const OrganizationSuggestPicker: React.FC<OrganizationSuggestPickerProps> = ({
  selectedOrgIds,
  onChange,
  organizations = [],
  onSearchServer,
  isLoading = false,
  placeholder = 'Search organization by name (e.g. Total Gaming) or email (e.g. org@gmail.com)...',
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [serverResults, setServerResults] = useState<OrganizationOption[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Map of loaded organizations by ID
  const orgMap = useMemo(() => {
    const map = new Map<string, OrganizationOption>();
    organizations.forEach((org) => map.set(org.id, org));
    serverResults.forEach((org) => map.set(org.id, org));
    return map;
  }, [organizations, serverResults]);

  // Selected organization objects
  const selectedOrgs = useMemo(() => {
    return selectedOrgIds.map((id) => {
      const match = orgMap.get(id);
      return match || { id, name: `Org ${id.slice(-4)}`, email: 'registered' };
    });
  }, [selectedOrgIds, orgMap]);

  // Debounced server search
  const handleServerSearch = useCallback(
    async (searchTerm: string) => {
      if (!onSearchServer || !searchTerm.trim()) {
        setServerResults([]);
        return;
      }
      try {
        setIsSearchingServer(true);
        const results = await onSearchServer(searchTerm.trim());
        setServerResults(results || []);
      } catch (err) {
        console.warn('[OrganizationSuggestPicker] Server search error:', err);
      } finally {
        setIsSearchingServer(false);
      }
    },
    [onSearchServer]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    setHighlightedIndex(0);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      handleServerSearch(val);
    }, 250);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter local & server combined suggestions
  const suggestions = useMemo(() => {
    const all = Array.from(orgMap.values());
    if (!query.trim()) {
      return all.slice(0, 15);
    }

    const q = query.trim().toLowerCase();
    return all.filter((org) => {
      const nameMatch = (org.name || '').toLowerCase().includes(q);
      const emailMatch = (org.email || '').toLowerCase().includes(q);
      return nameMatch || emailMatch;
    });
  }, [orgMap, query]);

  // Toggle selection
  const handleToggle = useCallback(
    (org: OrganizationOption) => {
      if (selectedOrgIds.includes(org.id)) {
        onChange(selectedOrgIds.filter((id) => id !== org.id));
      } else {
        onChange([...selectedOrgIds, org.id]);
      }
      inputRef.current?.focus();
    },
    [selectedOrgIds, onChange]
  );

  const handleRemove = (idToRemove: string) => {
    onChange(selectedOrgIds.filter((id) => id !== idToRemove));
  };

  const handleClearAll = () => {
    onChange([]);
    setQuery('');
  };

  const handleSelectAllSuggestions = () => {
    const idsToAdd = suggestions.map((s) => s.id);
    onChange(Array.from(new Set([...selectedOrgIds, ...idsToAdd])));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleToggle(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isBusy = isLoading || isSearchingServer;

  return (
    <div ref={containerRef} className={`space-y-2.5 font-sans relative ${className}`}>
      {/* 1. Header & Active Selected Chips */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-[var(--accent-primary)]" />
          <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
            Permitted Organizations ({selectedOrgIds.length})
          </span>
          {selectedOrgIds.length > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-bold border border-indigo-500/30">
              Private Access
            </span>
          )}
        </div>

        {selectedOrgIds.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-mono font-bold text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Selected Organization Chips */}
      {selectedOrgs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] max-h-32 overflow-y-auto custom-scrollbar">
          {selectedOrgs.map((org) => (
            <div
              key={org.id}
              className="group inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs font-medium shadow-xs transition-all hover:bg-indigo-500/25"
            >
              <OrgAvatar org={org} />
              <div className="flex flex-col leading-tight max-w-[160px] truncate">
                <span className="font-bold text-[var(--text-primary)] truncate text-[11px]">
                  {org.name}
                </span>
                <span className="text-[9px] font-mono text-[var(--text-muted)] truncate">
                  {org.email}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(org.id);
                }}
                className="ml-1 p-0.5 rounded hover:bg-white/20 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                title={`Remove ${org.name}`}
                aria-label={`Remove ${org.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. Interactive Search Box with live suggestions */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="h-3.5 w-3.5 absolute left-3 text-[var(--text-muted)] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] font-medium focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all shadow-inner"
          />

          {isBusy ? (
            <Loader2 className="h-3.5 w-3.5 absolute right-3 text-[var(--accent-primary)] animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {/* 3. Floating Autocomplete / Typeahead Suggestion Dropdown */}
        {isOpen && (
          <div
            role="listbox"
            className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden max-h-72 flex flex-col backdrop-blur-xl ring-1 ring-black/20 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {/* Quick Bulk Action Bar inside dropdown */}
            {suggestions.length > 0 && query.trim() && (
              <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-inset)]/50 flex items-center justify-between text-[11px]">
                <span className="font-mono text-[var(--text-secondary)] font-bold">
                  {suggestions.length} matching suggestion{suggestions.length === 1 ? '' : 's'}:
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllSuggestions}
                  className="font-bold text-[var(--accent-primary)] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Select all matching
                </button>
              </div>
            )}

            {/* Suggestions list */}
            <div className="overflow-y-auto max-h-60 custom-scrollbar divide-y divide-[var(--border-subtle)]/40 p-1">
              {suggestions.length === 0 ? (
                <div className="p-6 text-center space-y-1">
                  <AlertCircle className="h-5 w-5 text-[var(--text-muted)] mx-auto" />
                  <p className="text-xs font-bold text-[var(--text-secondary)]">
                    No organizations match "{query}"
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Try searching by registered email address or official organization name.
                  </p>
                </div>
              ) : (
                suggestions.map((org, idx) => {
                  const isSelected = selectedOrgIds.includes(org.id);
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={org.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleToggle(org)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isHighlighted
                          ? 'bg-[var(--accent-primary)]/10 text-[var(--text-primary)]'
                          : isSelected
                          ? 'bg-indigo-500/10'
                          : 'hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <OrgAvatar org={org} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[var(--text-primary)] truncate flex items-center gap-1.5">
                            <HighlightMatch text={org.name} query={query} />
                          </div>
                          <div className="text-[11px] font-mono text-[var(--text-secondary)] truncate flex items-center gap-1">
                            <Mail className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                            <HighlightMatch text={org.email} query={query} />
                          </div>
                        </div>
                      </div>

                      {/* Selection State Badge */}
                      <div className="shrink-0 flex items-center">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold font-mono">
                            <Check className="h-3 w-3" /> Permitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-black border border-[var(--border-subtle)] text-[10px] font-bold text-[var(--text-secondary)] transition-all">
                            + Select
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dropdown Footer helper */}
            <div className="p-2 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-inset)]/40 flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
              <span>↑↓ to navigate, Enter to toggle</span>
              <span>Esc to close</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
