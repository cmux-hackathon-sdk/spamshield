'use client';

import { useState, useEffect } from 'react';
import { SCAM_TYPES, getRiskColor, getRiskLabel, timeAgo } from '@/lib/data';
import type { Incident, ToastVariant } from '@/lib/types';

interface SSDrawerProps {
  incident: Incident;
  onClose: () => void;
  onToast: (message: string, variant?: ToastVariant) => void;
}

const FLAG_STYLES: Record<string, { label: string; style: React.CSSProperties }> = {
  urgency:       { label: 'URGENCY',       style: { background: '#78350f', color: '#fbbf24', border: '1px solid #92400e' } },
  impersonation: { label: 'IMPERSONATION', style: { background: '#1e1b4b', color: '#a5b4fc', border: '1px solid #312e81' } },
  money:         { label: 'MONEY REQUEST', style: { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b' } },
};

export function SSDrawer({ incident, onClose, onToast }: SSDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(incident.leExported);
  const [blacklisted, setBlacklisted] = useState(incident.blacklisted);
  const [loadingDots, setLoadingDots] = useState('');

  useEffect(() => {
    setExported(incident.leExported);
    setBlacklisted(incident.blacklisted);
  }, [incident.id, incident.leExported, incident.blacklisted]);

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const dots = ['', '.', '..', '...'];
    const iv = setInterval(() => { i = (i + 1) % dots.length; setLoadingDots(dots[i]); }, 300);
    return () => clearInterval(iv);
  }, [loading]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const color = getRiskColor(incident.risk);
  const t = SCAM_TYPES[incident.type] ?? SCAM_TYPES.unknown;
  const age = timeAgo(incident.timestamp);

  async function handleExport() {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/incidents/${incident.id}/export-for-le`, { method: 'POST' });
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const data = await response.json();
      setExported(true);
      if (data?.exported_at) {
        onToast('LE report generated from backend incident', 'success');
      } else {
        onToast('LE report generated', 'success');
      }
    } catch (error) {
      console.error('Export failed:', error);
      onToast('LE export failed. Check backend server.', 'danger');
    } finally {
      setLoading(false);
    }
  }

  function handleBlacklist() {
    const next = !blacklisted;
    setBlacklisted(next);
    onToast(next ? 'Number blacklisted' : 'Removed from blacklist', next ? 'success' : 'warning');
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, animation: 'fadeIn 200ms ease-out' }} />

      <div style={s.root}>
        <div style={s.header}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.08em', marginBottom: 3, textTransform: 'uppercase' }}>Incident</div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>#{incident.id}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: `${color}22`, color, border: `1px solid ${color}44`, letterSpacing: '0.06em' }}>
              {getRiskLabel(incident.risk)}
            </div>
            <button onClick={onClose} style={s.closeBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div style={s.body}>
          <div style={s.field}>
            <div style={s.fieldLabel}>Caller Number</div>
            <div style={s.fieldMono}>{incident.caller}</div>
          </div>

          <div style={s.field}>
            <div style={s.fieldLabel}>Location</div>
            <div style={s.fieldValue}>{incident.location.city}, {incident.location.country}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              {incident.location.spoofed && <span style={s.tagWarning}>⚠ Spoofed caller ID</span>}
              <span style={s.tagDefault}>Unverified location</span>
            </div>
          </div>

          <div style={s.field}>
            <div style={s.fieldLabel}>Scam Type</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.color, letterSpacing: '0.04em' }}>{t.label.toUpperCase()}</div>
          </div>

          <div style={s.field}>
            <div style={s.fieldLabel}>Detected</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{age} · {new Date(incident.timestamp).toLocaleString()}</div>
          </div>

          <div style={s.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={s.fieldLabel}>Risk Score</div>
              <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color }}>{incident.risk}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${incident.risk}%`, background: color, borderRadius: 3, transition: 'width 400ms ease-out' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              Confidence: <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{incident.confidence}%</span>
            </div>
          </div>

          <div style={s.divider} />
          <div style={s.sectionHeader}>Extracted Entities</div>

          {incident.entities.institution && (
            <div style={s.field}><div style={s.fieldLabel}>Institution</div><div style={s.fieldMono}>{incident.entities.institution}</div></div>
          )}
          {incident.entities.caseId && (
            <div style={s.field}><div style={s.fieldLabel}>Case ID</div><div style={s.fieldMono}>{incident.entities.caseId}</div></div>
          )}
          {incident.entities.badge && (
            <div style={s.field}><div style={s.fieldLabel}>Badge / Officer</div><div style={s.fieldMono}>{incident.entities.badge}</div></div>
          )}
          <div style={s.field}><div style={s.fieldLabel}>Payment Requested</div><div style={s.fieldValue}>{incident.entities.payment}</div></div>
          <div style={s.field}><div style={s.fieldLabel}>Callback Number</div><div style={s.fieldMono}>{incident.entities.callback}</div></div>

          <div style={s.divider} />

          {incident.cluster && (
            <>
              <div style={s.sectionHeader}>Cluster Match</div>
              <div style={{ ...s.field, background: 'rgba(30,144,255,0.06)', border: '1px solid rgba(30,144,255,0.15)', borderRadius: 6, padding: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Similar to <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{incident.cluster.count}</span> prior incidents:
                </div>
                {[`${incident.cluster.type} (all)`, incident.cluster.region, `Last ${incident.cluster.period}`, 'Same institution name pattern'].map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 3 }}>
                    <span style={{ color: 'var(--accent)', marginRight: 6 }}>•</span>{item}
                  </div>
                ))}
              </div>
              <div style={s.divider} />
            </>
          )}

          <div style={s.sectionHeader}>Flags & Alerts</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {incident.flags.map(flag => {
              const f = FLAG_STYLES[flag];
              return f ? (
                <span key={flag} style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 12, letterSpacing: '0.06em', ...f.style }}>{f.label}</span>
              ) : null;
            })}
          </div>

          <div style={s.divider} />

          <div style={{ marginBottom: 8 }}>
            {exported ? (
              <div style={{ fontSize: 11, color: 'var(--text-mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                Exported to LE{incident.leExportDate ? ` · ${incident.leExportDate}` : ''}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Not yet exported to law enforcement</div>
            )}
          </div>
        </div>

        <div style={s.footer}>
          <button onClick={handleExport} disabled={loading} style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={s.spinner} />Generating{loadingDots}
              </span>
            ) : exported ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                Re-export LE Report
              </span>
            ) : 'Generate LE Report'}
          </button>
          <button onClick={handleBlacklist} style={{ ...s.btnSecondary, borderColor: blacklisted ? 'var(--text-mono)' : 'var(--border-emphasis)', color: blacklisted ? 'var(--text-mono)' : 'var(--text-secondary)' }}>
            {blacklisted ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                Blacklisted
              </span>
            ) : 'Blacklist Number'}
          </button>
        </div>
      </div>
    </>
  );
}

const s = {
  root: { position: 'absolute' as const, top: 0, right: 0, bottom: 0, width: 420, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' as const, zIndex: 60, animation: 'slideInRight 200ms cubic-bezier(0.16, 1, 0.3, 1)', overflow: 'hidden' as const },
  header: { padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', flexShrink: 0 },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, transition: 'all 150ms' },
  body: { flex: 1, overflowY: 'auto' as const, padding: '16px 20px' },
  footer: { padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexShrink: 0, background: 'var(--bg-secondary)' },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, marginBottom: 4 },
  fieldValue: { fontSize: 14, color: 'var(--text-primary)' },
  fieldMono: { fontSize: 13, fontFamily: 'monospace', color: 'var(--text-mono)' },
  divider: { height: 1, background: 'var(--border-subtle)', margin: '16px 0' },
  sectionHeader: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' as const, marginBottom: 12 },
  tagWarning: { fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: '#78350f', color: '#fbbf24', border: '1px solid #92400e' },
  tagDefault: { fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: '#1e293b', color: 'var(--text-tertiary)', border: '1px solid #334155' },
  btnPrimary: { flex: 1, padding: '10px 16px', background: 'var(--accent)', color: '#000000', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms', letterSpacing: '0.02em' } as React.CSSProperties,
  btnSecondary: { flex: 1, padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-emphasis)', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' } as React.CSSProperties,
  spinner: { display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#000000', borderRadius: '50%', animation: 'spin 700ms linear infinite' } as React.CSSProperties,
};
