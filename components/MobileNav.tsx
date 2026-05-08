'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { href: '/domains',    label: 'Domains'    },
  { href: '/sparks',     label: 'Sparks'     },
  { href: '/collisions', label: 'Collisions' },
  { href: '/essays',     label: 'Essays'     },
] as const;

// ─── SVG icons ────────────────────────────────────────────────────────────────
function IconDomains({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="6" height="6" rx="1.5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
      <rect x="10" y="2" width="6" height="6" rx="1.5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
      <rect x="2" y="10" width="6" height="6" rx="1.5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
      <rect x="10" y="10" width="6" height="6" rx="1.5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
    </svg>
  );
}

function IconSparks({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M10 2L6 10h5l-3 6 8-9h-5l3-5z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"
        opacity={active ? 1 : 0.7}/>
    </svg>
  );
}

function IconCollisions({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
      <line x1="3.5" y1="3.5" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
      <line x1="14.5" y1="3.5" x2="3.5" y2="14.5" stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
    </svg>
  );
}

function IconEssays({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="2" width="12" height="14" rx="2"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
      <line x1="6" y1="7" x2="12" y2="7" stroke={active ? 'var(--mnav-bg)' : 'currentColor'}
        strokeWidth="1.2" strokeLinecap="round" opacity={active ? 1 : 0.5}/>
      <line x1="6" y1="10" x2="12" y2="10" stroke={active ? 'var(--mnav-bg)' : 'currentColor'}
        strokeWidth="1.2" strokeLinecap="round" opacity={active ? 1 : 0.5}/>
      <line x1="6" y1="13" x2="10" y2="13" stroke={active ? 'var(--mnav-bg)' : 'currentColor'}
        strokeWidth="1.2" strokeLinecap="round" opacity={active ? 1 : 0.5}/>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2.8" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="7.5" y1="0.5" x2="7.5" y2="2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="7.5" y1="12.5" x2="7.5" y2="14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="0.5" y1="7.5" x2="2.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="12.5" y1="7.5" x2="14.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="2.7" y1="2.7" x2="4.1" y2="4.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="10.9" y1="10.9" x2="12.3" y2="12.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="12.3" y1="2.7" x2="10.9" y2="4.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4.1" y1="10.9" x2="2.7" y2="12.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 2C4.46 2 2 4.46 2 7.5C2 10.54 4.46 13 7.5 13C9.9 13 11.6 11.4 12.3 9.3C11.6 9.6 10.8 9.8 9.9 9.8C6.9 9.8 4.5 7.4 4.5 4.4C4.5 3.3 4.9 2.3 5.5 1.5C6.2 1.8 7 2 7.5 2Z"
        stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MobileNav() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'void' | 'sepia'>('void');

  useEffect(() => {
    const sync = () => {
      const t = document.documentElement.getAttribute('data-theme') as 'void' | 'sepia' | null;
      if (t === 'void' || t === 'sepia') setTheme(t);
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  function toggleTheme() {
    const next = theme === 'void' ? 'sepia' : 'void';
    setTheme(next);
    localStorage.setItem('nylus-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <nav className="mnav">
      {TABS.map(({ href, label }) => {
        const isActive =
          pathname === href ||
          (href !== '/' && pathname != null && pathname.startsWith(href + '/'));
        return (
          <Link key={href} href={href} className={`mnav-tab${isActive ? ' mnav-active' : ''}`}>
            <span className="mnav-icon">
              {label === 'Domains'    && <IconDomains    active={isActive} />}
              {label === 'Sparks'     && <IconSparks     active={isActive} />}
              {label === 'Collisions' && <IconCollisions active={isActive} />}
              {label === 'Essays'     && <IconEssays     active={isActive} />}
            </span>
            <span className="mnav-label">{label}</span>
          </Link>
        );
      })}

      {/* Theme toggle */}
      <button
        className="mnav-tab mnav-toggle-btn"
        onClick={toggleTheme}
        aria-label={theme === 'void' ? 'Switch to parchment' : 'Switch to void'}
      >
        <span className="mnav-icon">
          {theme === 'void' ? <SunIcon /> : <MoonIcon />}
        </span>
        <span className="mnav-label">{theme === 'void' ? 'Parchment' : 'Void'}</span>
      </button>
    </nav>
  );
}
