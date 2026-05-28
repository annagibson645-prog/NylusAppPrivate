'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type SearchEntry = {
  id: string;
  title: string;
  type: string;
  domain: string;
  status: string;
  excerpt: string;
  color: string;
};

const TYPE_ROUTE: Record<string, string> = {
  concept:    '/concept',
  hub:        '/hub',
  collision:  '/collision',
  spark:      '/spark',
  research:   '/research',
  source:     '/source',
  essay:      '/essay',
};

const TYPE_LABEL: Record<string, string> = {
  concept:   'concept',
  hub:       'hub',
  collision: 'collision',
  spark:     'spark',
  research:  'research',
  source:    'source',
  'essay-seed': 'essay seed',
};

// Module-level cache so we only fetch once across the session
let _cachedIndex: SearchEntry[] | null = null;
let _fetchPromise: Promise<SearchEntry[]> | null = null;

function loadIndex(): Promise<SearchEntry[]> {
  if (_cachedIndex) return Promise.resolve(_cachedIndex);
  if (_fetchPromise) return _fetchPromise;
  _fetchPromise = fetch('/data/search-index.json')
    .then(r => r.json())
    .then((data: SearchEntry[]) => { _cachedIndex = data; return data; });
  return _fetchPromise;
}

interface VaultSearchProps {
  placeholder?: string;
  autoFocus?: boolean;
  showTypes?: string[];
  /* Palette-aware colors — pass from parent so search matches the page theme */
  colors?: {
    bg: string;
    border: string;
    ink: string;
    ink2: string;
    card: string;
    cardHov: string;
  };
}

const DEFAULT_COLORS = {
  bg:      'rgba(13,11,24,0.98)',
  border:  'rgba(255,255,255,0.12)',
  ink:     '#f0eeff',
  ink2:    '#b4acd0',
  card:    'rgba(255,255,255,0.04)',
  cardHov: 'rgba(255,255,255,0.08)',
};

export default function VaultSearch({
  placeholder = 'Search the vault…',
  autoFocus = false,
  showTypes = ['concept', 'hub', 'collision', 'spark'],
  colors = DEFAULT_COLORS,
}: VaultSearchProps) {
  const router = useRouter();
  const [query, setQuery]     = useState('');
  const [index, setIndex]     = useState<SearchEntry[]>([]);
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [selected, setSelected] = useState(0);
  const [open, setOpen]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  // Load index once
  useEffect(() => {
    loadIndex().then(setIndex);
  }, []);

  // Filter on query change
  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const q = query.toLowerCase();
    const filtered = index
      .filter(e => showTypes.includes(e.type))
      .filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.excerpt ?? '').toLowerCase().includes(q)
      )
      .slice(0, 24);
    setResults(filtered);
    setSelected(0);
    setOpen(filtered.length > 0);
  }, [query, index, showTypes]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goTo = useCallback((entry: SearchEntry) => {
    const base = TYPE_ROUTE[entry.type] ?? '/concept';
    router.push(`${base}/${entry.id}`);
    setQuery('');
    setOpen(false);
  }, [router]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, results.length - 1));
      scrollSelectedIntoView(selected + 1);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
      scrollSelectedIntoView(selected - 1);
    }
    if (e.key === 'Enter' && results[selected]) {
      goTo(results[selected]);
    }
    if (e.key === 'Escape') {
      setQuery('');
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const scrollSelectedIntoView = (idx: number) => {
    if (!listRef.current) return;
    const item = listRef.current.children[idx] as HTMLElement;
    if (item) item.scrollIntoView({ block: 'nearest' });
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input */}
      <div style={{ position: 'relative' }}>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            opacity: 0.4, pointerEvents: 'none', color: colors.ink,
          }}
        >
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '9px 12px 9px 36px',
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            color: colors.ink,
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = colors.ink2)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = colors.border)}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus(); }}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: colors.ink2, fontSize: 16, lineHeight: 1, padding: 2, opacity: 0.6,
            }}
            aria-label="Clear search"
          >×</button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            zIndex: 999,
            maxHeight: 380,
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {results.map((entry, i) => {
            const isActive = i === selected;
            return (
              <div
                key={entry.id}
                onMouseDown={e => { e.preventDefault(); goTo(entry); }}
                onMouseEnter={() => setSelected(i)}
                style={{
                  padding: '9px 14px',
                  background: isActive ? colors.cardHov : 'transparent',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'grid',
                  gridTemplateColumns: '8px 1fr auto',
                  gap: '0 10px',
                  alignItems: 'center',
                  transition: 'background 0.1s',
                }}
              >
                {/* Domain dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: entry.color, flexShrink: 0, marginTop: 1,
                }} />

                {/* Title + excerpt */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    color: colors.ink,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {highlightMatch(entry.title, query)}
                  </div>
                  {entry.excerpt && (
                    <div style={{
                      fontSize: 11, color: colors.ink2, marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {entry.excerpt.slice(0, 120)}
                    </div>
                  )}
                </div>

                {/* Type badge */}
                <div style={{
                  fontSize: 10, color: colors.ink2, opacity: 0.6,
                  fontFamily: 'var(--font-jetbrains, monospace)',
                  letterSpacing: '0.06em', flexShrink: 0,
                  textTransform: 'uppercase',
                }}>
                  {TYPE_LABEL[entry.type] ?? entry.type}
                </div>
              </div>
            );
          })}

          {/* Result count footer */}
          <div style={{
            padding: '7px 14px',
            fontSize: 11, color: colors.ink2, opacity: 0.5,
            fontFamily: 'var(--font-jetbrains, monospace)',
            letterSpacing: '0.06em',
          }}>
            {results.length} result{results.length !== 1 ? 's' : ''}{results.length === 24 ? ' (showing top 24)' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

/* Bold the matched substring in the title */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}
