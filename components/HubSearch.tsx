"use client";
import { useState } from 'react';
import Link from 'next/link';

interface ConceptNode {
  id: string;
  title: string;
  excerpt?: string;
  sources?: number;
  backlinks?: string[];
}

export default function HubSearch({ concepts, domainColor }: {
  concepts: ConceptNode[];
  domainColor: string;
}) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const results = query
    ? concepts.filter(c =>
        c.title.toLowerCase().includes(query) ||
        (c.excerpt ?? '').toLowerCase().includes(query)
      )
    : [];

  return (
    <div className="hub-search-wrap" style={{ '--dc': domainColor } as React.CSSProperties}>
      <div className="hub-search-row">
        <svg className="hub-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          className="hub-search-input"
          placeholder={`Search all ${concepts.length} concepts…`}
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        {q && (
          <button className="hub-search-clear" onClick={() => setQ('')} aria-label="Clear">✕</button>
        )}
      </div>

      {query && (
        <div className="hub-search-results">
          {results.length === 0 ? (
            <div className="hub-search-empty">No concepts match "{q}"</div>
          ) : (
            <>
              <div className="hub-search-count">{results.length} result{results.length !== 1 ? 's' : ''}</div>
              <div className="hub-section-body">
                {results.map(n => (
                  <Link key={n.id} href={`/concept/${n.id}`} className="hub-concept-row">
                    <div className="hcr-left">
                      <div className="hcr-title">{n.title}</div>
                      {n.excerpt && (
                        <div className="hcr-excerpt">
                          {n.excerpt.slice(0, 160)}{n.excerpt.length > 160 ? '…' : ''}
                        </div>
                      )}
                    </div>
                    <div className="hcr-right">
                      {(n.sources ?? 0) > 0 && <span className="hcr-meta">{n.sources} src</span>}
                      {(n.backlinks?.length ?? 0) > 0 && <span className="hcr-meta">{n.backlinks!.length} bl</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .hub-search-wrap { margin-bottom: 40px; }
        .hub-search-row {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #2a2640;
          border-radius: 4px;
          padding: 10px 14px;
          background: #0a0916;
          transition: border-color 0.15s;
        }
        .hub-search-row:focus-within {
          border-color: var(--dc, #a78bfa);
          background: #0d0b1a;
        }
        .hub-search-icon { color: #4a4468; flex-shrink: 0; }
        .hub-search-row:focus-within .hub-search-icon { color: var(--dc, #a78bfa); opacity: 0.6; }
        .hub-search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: var(--font-jetbrains), monospace;
          font-size: 13px;
          color: #c0bcd8;
          caret-color: var(--dc, #a78bfa);
          letter-spacing: 0.02em;
        }
        .hub-search-input::placeholder { color: #4a4468; }
        .hub-search-clear {
          background: none;
          border: none;
          color: #4a4468;
          cursor: pointer;
          font-size: 11px;
          padding: 0;
          line-height: 1;
          transition: color 0.15s;
          flex-shrink: 0;
        }
        .hub-search-clear:hover { color: #a09ab8; }
        .hub-search-results { margin-top: 16px; }
        .hub-search-count {
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #4a4468;
          margin-bottom: 12px;
        }
        .hub-search-empty {
          font-family: var(--font-jetbrains), monospace;
          font-size: 12px;
          color: #4a4468;
          padding: 24px 0;
          text-align: center;
        }
        [data-theme="sepia"] .hub-search-row {
          background: #ede4d0;
          border-color: #c8b890;
        }
        [data-theme="sepia"] .hub-search-row:focus-within {
          background: #e8ddc8;
          border-color: var(--dc, #7a5a30);
        }
        [data-theme="sepia"] .hub-search-input { color: #2a1e08; }
        [data-theme="sepia"] .hub-search-input::placeholder { color: #b8a880; }
        [data-theme="sepia"] .hub-search-icon { color: #b8a880; }
        [data-theme="sepia"] .hub-search-clear { color: #b8a880; }
        [data-theme="sepia"] .hub-search-count { color: #b8a880; }
        [data-theme="sepia"] .hub-search-empty { color: #b8a880; }
      `}</style>
    </div>
  );
}
