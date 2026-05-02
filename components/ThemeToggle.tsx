'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'void' | 'sepia'>('void');

  // Persist + apply on mount
  useEffect(() => {
    const saved = localStorage.getItem('nylus-theme') as 'void' | 'sepia' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  function toggle() {
    const next = theme === 'void' ? 'sepia' : 'void';
    setTheme(next);
    localStorage.setItem('nylus-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'void' ? 'Switch to parchment mode' : 'Switch to void mode'}
      style={{
        background: 'none',
        border: '1px solid currentColor',
        borderRadius: 3,
        padding: '4px 10px',
        cursor: 'pointer',
        fontFamily: 'var(--font-jetbrains), monospace',
        fontSize: 9,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: theme === 'void' ? '#4a4468' : '#8b7355',
        transition: 'color 0.2s, border-color 0.2s',
        lineHeight: 1.4,
      }}
    >
      {theme === 'void' ? 'Parchment' : 'Void'}
    </button>
  );
}
