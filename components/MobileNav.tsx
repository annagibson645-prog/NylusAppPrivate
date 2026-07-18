'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { href: '/',           label: 'Dashboard'  },
  { href: '/hubs',       label: 'Hubs'       },
  { href: '/research',   label: 'Research'   },
  { href: '/essays',     label: 'Essays'     },
  { href: '/craft',      label: 'Craft'      },
  { href: '/collisions', label: 'Collisions' },
  { href: '/sparks',     label: 'Sparks'     },
  { href: '/threads',    label: 'Threads'    },
  { href: '/tones',      label: 'Tomes'      },
  { href: '/council',    label: 'Council'    },
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

function IconHubs({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2.5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
      <circle cx="3.5" cy="5" r="1.5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.2" opacity={active ? 1 : 0.6}/>
      <circle cx="14.5" cy="5" r="1.5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.2" opacity={active ? 1 : 0.6}/>
      <circle cx="3.5" cy="13" r="1.5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.2" opacity={active ? 1 : 0.6}/>
      <circle cx="14.5" cy="13" r="1.5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.2" opacity={active ? 1 : 0.6}/>
      <line x1="6.8" y1="7.5" x2="4.8" y2="6.2" stroke="currentColor" strokeWidth="1.1" opacity={active ? 0.8 : 0.5}/>
      <line x1="11.2" y1="7.5" x2="13.2" y2="6.2" stroke="currentColor" strokeWidth="1.1" opacity={active ? 0.8 : 0.5}/>
      <line x1="6.8" y1="10.5" x2="4.8" y2="11.8" stroke="currentColor" strokeWidth="1.1" opacity={active ? 0.8 : 0.5}/>
      <line x1="11.2" y1="10.5" x2="13.2" y2="11.8" stroke="currentColor" strokeWidth="1.1" opacity={active ? 0.8 : 0.5}/>
    </svg>
  );
}

function IconResearch({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* open book */}
      <path d="M9 4v10M9 4C9 4 6 3 3 4v10c3-1 6 0 6 0M9 4c0 0 3-1 6 0v10c-3-1-6 0-6 0"
        stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"
        fill="none" opacity={active ? 1 : 0.7}/>
    </svg>
  );
}

function IconEssays({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* pen nib writing a line */}
      <path d="M12.3 2.3L15.7 5.7L7.2 14.2L3 15L3.8 10.8L12.3 2.3Z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" opacity={active ? 1 : 0.7}/>
      <line x1="10.1" y1="4.5" x2="13.5" y2="7.9" stroke="currentColor" strokeWidth="1.1" opacity={active ? 0.9 : 0.6}/>
    </svg>
  );
}

function IconThreads({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* two interwoven strands */}
      <path d="M2.5 4.5C6 4.5 6 13.5 9.5 13.5C13 13.5 13 4.5 15.5 4.5"
        stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7} strokeLinecap="round"/>
      <path d="M2.5 13.5C6 13.5 6 4.5 9.5 4.5C13 4.5 13 13.5 15.5 13.5"
        stroke="currentColor" strokeWidth="1.3" opacity={active ? 0.6 : 0.4} strokeLinecap="round"/>
    </svg>
  );
}

function IconCraft({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* margin spine + note lines — a ledger of sessions */}
      <line x1="3" y1="2.5" x2="3" y2="15.5" stroke="currentColor" strokeWidth="1.3" opacity={active ? 0.9 : 0.6}/>
      <circle cx="3" cy="5" r="1.4" fill="currentColor" opacity={active ? 1 : 0.7}/>
      <line x1="7" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
      <circle cx="3" cy="9.5" r="1.4" fill="currentColor" opacity={active ? 1 : 0.7}/>
      <line x1="7" y1="9.5" x2="13" y2="9.5" stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
      <circle cx="3" cy="14" r="1.4" fill="currentColor" opacity={active ? 1 : 0.7}/>
      <line x1="7" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
    </svg>
  );
}

function IconCouncil({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* three seats at a table */}
      <circle cx="9" cy="4" r="2"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.8}/>
      <circle cx="3.5" cy="9.5" r="1.7"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.2" opacity={active ? 0.9 : 0.6}/>
      <circle cx="14.5" cy="9.5" r="1.7"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.2" opacity={active ? 0.9 : 0.6}/>
      <path d="M3 15c0-2.2 2.7-3.5 6-3.5s6 1.3 6 3.5"
        stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
    </svg>
  );
}

function IconTones({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* three book spines */}
      <rect x="2.5" y="3" width="3.2" height="12" rx="1"
        fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
      <rect x="7.4" y="3" width="3.2" height="12" rx="1"
        fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" opacity={active ? 0.85 : 0.6}/>
      <rect x="12" y="4.5" width="3.5" height="10.5" rx="1" transform="rotate(9 13.7 9.7)"
        fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" opacity={active ? 0.7 : 0.5}/>
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
          (pathname != null && pathname.startsWith(href + '/'));
        return (
          <Link key={href} href={href} className={`mnav-tab${isActive ? ' mnav-active' : ''}`}>
            <span className="mnav-icon">
              {label === 'Dashboard'  && <IconDomains    active={isActive} />}
              {label === 'Sparks'     && <IconSparks     active={isActive} />}
              {label === 'Collisions' && <IconCollisions active={isActive} />}
              {label === 'Hubs'       && <IconHubs       active={isActive} />}
              {label === 'Research'   && <IconResearch   active={isActive} />}
              {label === 'Essays'     && <IconEssays     active={isActive} />}
              {label === 'Craft'      && <IconCraft      active={isActive} />}
              {label === 'Threads'    && <IconThreads    active={isActive} />}
              {label === 'Tomes'      && <IconTones      active={isActive} />}
              {label === 'Council'    && <IconCouncil    active={isActive} />}
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
