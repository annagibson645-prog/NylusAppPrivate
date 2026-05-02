"use client";
// ConstellationApp.tsx — client wrapper that loads ConstellationV2 without SSR.
// Constellation uses requestAnimationFrame, Math.random, and browser APIs
// that must not run during server-side rendering.

import dynamic from 'next/dynamic';
import type { NylusData } from '@/lib/adapt-vault';

const ConstellationV2 = dynamic(() => import('./ConstellationV2'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0e0d14',
      color: 'rgba(240,236,245,0.3)',
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 11,
      letterSpacing: '0.2em',
    }}>
      LOADING VAULT…
    </div>
  ),
});

export default function ConstellationApp({ data }: { data: NylusData }) {
  return (
    <div style={{ width: '100vw', height: '100dvh', overflow: 'hidden', background: '#0e0d14' }}>
      <ConstellationV2 data={data} />
    </div>
  );
}
