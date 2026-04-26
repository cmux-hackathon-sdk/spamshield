'use client';

import { useState, useRef, useEffect } from 'react';
import { SCAM_TYPES, getRiskColor, timeAgo } from '@/lib/data';
import type { Incident } from '@/lib/types';

interface SSLiveFeedProps {
  incidents: Incident[];
  selectedId: string | undefined;
  onSelectIncident: (inc: Incident) => void;
}

export function SSLiveFeed({ incidents, selectedId, onSelectIncident }: SSLiveFeedProps) {
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(incidents.length);

  useEffect(() => {
    if (paused) return;
    if (incidents.length > prevLen.current && scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
    prevLen.current = incidents.length;
  }, [incidents.length, paused]);

  return (
    <div style={s.root}>
      <div style={s.headerBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--threat-live)', boxShadow: '0 0 6px var(--threat-live)', animation: 'pulse-dot 1s ease-in-out infinite' }} />
          <span style={s.headerLabel}>LIVE INCIDENTS</span>
          <span style={s.countBadge}>{incidents.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setPaused(p => !p)}
            style={{ ...s.controlBtn, background: paused ? 'rgba(249,115,22,0.15)' : 'transparent', color: paused ? '#f97316' : 'var(--text-secondary)', border: paused ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent' }}
          >
            {paused ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                Resume
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                Pause
              </span>
            )}
          </button>
          <button
            onClick={() => { if (scrollRef.current) scrollRef.current.scrollLeft = 0; }}
            style={s.controlBtn}
            title="Jump to latest"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/></svg>
          </button>
        </div>
      </div>

      <div ref={scrollRef} style={s.scroll}>
        {incidents.map((incident, idx) => {
          const color = SCAM_TYPES[incident.type]?.color ?? 'var(--text-tertiary)';
          const isSelected = selectedId === incident.id;
          const isLive = incident.status === 'live';

          return (
            <div
              key={incident.id}
              onClick={() => onSelectIncident(incident)}
              style={{
                ...s.card,
                borderColor: isSelected ? 'var(--accent)' : isLive ? `${color}55` : 'var(--border-subtle)',
                background: isSelected ? 'rgba(30,144,255,0.08)' : 'var(--bg-tertiary)',
                animation: idx === 0 ? 'slideInLeft 200ms ease-out' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: isLive ? `0 0 5px ${color}` : 'none' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.05em' }}>
                    {SCAM_TYPES[incident.type]?.short ?? 'UNKNOWN'}
                  </span>
                </div>
                {isLive && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--threat-live)', letterSpacing: '0.08em' }}>LIVE</span>}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {incident.location.city}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 8 }}>{incident.location.countryCode}</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: getRiskColor(incident.risk) }}>
                  {incident.risk}%
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{timeAgo(incident.timestamp)}</span>
              </div>

              <div style={{ marginTop: 6, height: 2, background: 'var(--border-subtle)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${incident.risk}%`, background: getRiskColor(incident.risk), borderRadius: 1 }} />
              </div>
            </div>
          );
        })}
        <div style={{ flexShrink: 0, width: 16 }} />
      </div>
    </div>
  );
}

const s = {
  root: { height: 158, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' as const, flexShrink: 0 },
  headerBar: { height: 32, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 },
  headerLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const },
  countBadge: { fontSize: 10, fontWeight: 700, fontFamily: 'monospace', background: '#252d45', color: 'var(--text-mono)', padding: '1px 6px', borderRadius: 10 },
  controlBtn: { background: 'transparent', border: '1px solid transparent', borderRadius: 4, color: 'var(--text-secondary)', fontSize: 11, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 150ms' },
  scroll: { flex: 1, display: 'flex', overflowX: 'auto' as const, padding: '8px 12px', gap: 8 },
  card: { width: 140, padding: '10px 12px', borderRadius: 4, border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 150ms', display: 'flex', flexDirection: 'column' as const, flexShrink: 0 },
};
