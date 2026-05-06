'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'void' | 'sepia'>('void');

  useEffect(() => {
    const saved = localStorage.getItem('nylus-theme') as 'void' | 'sepia' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.innerWidth <= 1024) {
      // No saved preference on mobile — default to parchment
      setTheme('sepia');
      document.documentElement.setAttribute('data-theme', 'sepia');
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
      title={theme === 'void' ? 'Parchment' : 'Void'}
      style={{
        background: 'none',
        border: 'none',
        borderRadius: 4,
        padding: '6px',
        cursor: 'pointer',
        color: theme === 'void' ? '#4a4468' : '#8b7355',
        transition: 'color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
      }}
    >
      {theme === 'void' ? (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.2"/>
          <line x1="7.5" y1="0.5" x2="7.5" y2="2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="7.5" y1="12.5" x2="7.5" y2="14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="0.5" y1="7.5" x2="2.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="12.5" y1="7.5" x2="14.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="2.7" y1="2.7" x2="4.1" y2="4.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="10.9" y1="10.9" x2="12.3" y2="12.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="12.3" y1="2.7" x2="10.9" y2="4.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="4.1" y1="10.9" x2="2.7" y2="12.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.5 2C4.46 2 2 4.46 2 7.5C2 10.54 4.46 13 7.5 13C9.9 13 11.6 11.4 12.3 9.3C11.6 9.6 10.8 9.8