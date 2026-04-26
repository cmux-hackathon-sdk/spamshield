'use client';

import { useState } from 'react';
import type { Incident } from '@/lib/types';

type View = 'map' | 'list';

interface SSHeaderProps {
  incidents: Incident[];
  onHelp: () => void;
  onSettings: () => void;
  onRefresh: () => void;
  onLEPortal: () => void;
  view: View;
  onViewChange: (v: View) => void;
}

export function SSHeader({ incidents, onHelp, onSettings, onRefresh, onLEPortal, view, onViewChange }: SSHeaderProps) {
  const [copied, setCopied] = useState(false);

  const totalRisk = incidents.length
    ? Math.round(incidents.reduce((a, b) => a + b.risk, 0) / incidents.length)
    : 0;

  const defcon = totalRisk >= 75 ? { level: 1, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
    : totalRisk >= 55 ? { level: 2, color: '#f97316', bg: 'rgba(249,115,22,0.15)' }
    : totalRisk >= 40 ? { level: 3, color: '#eab308', bg: 'rgba(234,179,8,0.15)' }
    : { level: 4, color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };

  const liveCount = incidents.filter(i => i.status === 'live').length;

  function handleCopyLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header style={s.root}>
      <div style={s.left}>
        <div style={s.logo}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <polygon points="10,1 19,5.5 19,14.5 10,19 1,14.5 1,5.5" stroke="var(--accent)" strokeWidth="1.5" fill="rgba(30,144,255,0.12)" />
            <circle cx="10" cy="10" r="2.5" fill="var(--accent)" />
            <line x1="10" y1="4" x2="10" y2="7.5" stroke="var(--accent)" strokeWidth="1.2" />
            <line x1="10" y1="12.5" x2="10" y2="16" stroke="var(--accent)" strokeWidth="1.2" />
          </svg>
        </div>
        <span style={s.brand}>SpamShield</span>
        <div style={{ ...s.defconBadge, background: defcon.bg, border: `1px solid ${defcon.color}33`, color: defcon.color }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: defcon.color, marginRight: 6, boxShadow: `0 0 6px ${defcon.color}` }} />
          DEFCON {defcon.level}: {totalRisk}%
        </div>
        <div style={s.statusBadge}>
          <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: 'var(--threat-live)', marginRight: 6, animation: 'pulse-dot 1s ease-in-out infinite' }} />
          LIVE · {liveCount} active
        </div>
      </div>

      <div style={s.center}>
        <div style={s.viewToggle}>
          <button
            onClick={() => onViewChange('map')}
            style={{ ...s.viewBtn, background: view === 'map' ? 'var(--border-subtle)' : 'transparent', color: view === 'map' ? 'var(--text-primary)' : 'var(--text-tertiary)', borderColor: view === 'map' ? 'var(--border-emphasis)' : 'transparent' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}>
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Map
          </button>
          <button
            onClick={() => onViewChange('list')}
            style={{ ...s.viewBtn, background: view === 'list' ? 'var(--border-subtle)' : 'transparent', color: view === 'list' ? 'var(--text-primary)' : 'var(--text-tertiary)', borderColor: view === 'list' ? 'var(--border-emphasis)' : 'transparent' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}>
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Incidents
          </button>
        </div>
        <div style={s.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input style={s.searchInput} placeholder="Search incidents by number, city, type..." />
        </div>
      </div>

      <div style={s.right}>
        <button style={s.iconBtn} onClick={onLEPortal} title="Law Enforcement Portal">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ fontSize: 11, marginLeft: 4 }}>LE Portal</span>
        </button>
        <button style={s.iconBtn} onClick={handleCopyLink} title="Copy link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span style={{ fontSize: 11, marginLeft: 4 }}>{copied ? 'Copied!' : 'Link'}</span>
        </button>
        <button style={s.iconBtn} onClick={onRefresh} title="Refresh data">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          <span style={{ fontSize: 11, marginLeft: 4 }}>Refresh</span>
        </button>
        <button style={s.iconBtn} onClick={onHelp} title="Help">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          <span style={{ fontSize: 11, marginLeft: 4 }}>Help</span>
        </button>
        <button style={s.iconBtnSquare} onClick={onSettings} title="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>
    </header>
  );
}

const s = {
  root: { height: 64, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, zIndex: 100, position: 'relative' as const },
  left: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 320 },
  logo: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  defconBadge: { fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 4, display: 'flex', alignItems: 'center', fontFamily: 'monospace' },
  statusBadge: { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 4, background: 'rgba(180,40,40,0.1)', border: '1px solid rgba(180,40,40,0.25)', color: '#b04040', display: 'flex', alignItems: 'center' },
  center: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 },
  viewToggle: { display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 3, gap: 2 },
  viewBtn: { fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 4, cursor: 'pointer', border: '1px solid transparent', fontFamily: 'inherit', display: 'flex', alignItems: 'center', transition: 'all 150ms', letterSpacing: '0.02em' } as React.CSSProperties,
  searchWrap: { display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '0 12px', width: 360, height: 36 },
  searchInput: { background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, width: '100%', fontFamily: 'inherit' } as React.CSSProperties,
  right: { display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  iconBtn: { background: 'transparent', border: '1px solid transparent', borderRadius: 6, color: 'var(--text-secondary)', padding: '6px 10px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', transition: 'all 150ms', fontFamily: 'inherit' },
  iconBtnSquare: { background: 'transparent', border: '1px solid transparent', borderRadius: 6, color: 'var(--text-secondary)', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' },
};
