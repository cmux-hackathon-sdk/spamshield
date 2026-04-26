'use client';

import { useState, useEffect } from 'react';
import { SCAM_TYPES, getRiskColor } from '@/lib/data';
import type { Incident, ScamType, ToastVariant } from '@/lib/types';

/* ─── Shared shell ─── */
function ModalShell({ title, onClose, children, width = 560 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={ms.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...ms.panel, width }} onClick={e => e.stopPropagation()}>
        <div style={ms.header}>
          <span style={ms.title}>{title}</span>
          <button onClick={onClose} style={ms.closeBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={ms.body}>{children}</div>
      </div>
    </div>
  );
}

/* ─── LE Portal ─── */
export function SSLEPortal({ incidents, onClose, onToast }: { incidents: Incident[]; onClose: () => void; onToast: (msg: string, v?: ToastVariant) => void }) {
  const [filter, setFilter] = useState({ country: '', type: '', risk: '' });
  const [selected, setSelected] = useState(new Set<string>());
  const [page, setPage] = useState(1);
  const [viewingDetail, setViewingDetail] = useState<Incident | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const PER_PAGE = 6;

  const filtered = incidents.filter(i => {
    if (filter.country && !i.location.country.toLowerCase().includes(filter.country.toLowerCase())) return false;
    if (filter.type && i.type !== filter.type) return false;
    if (filter.risk === 'high' && i.risk < 80) return false;
    return true;
  }).sort((a, b) => b.risk - a.risk);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleSubmitToAgency() {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onToast(`Successfully forwarded ${selected.size} case files to partner agencies.`, 'success');
      setSelected(new Set());
    }, 1500);
  }

  if (viewingDetail) {
    return (
      <ModalShell title={`Case File: ${viewingDetail.entities?.caseId || viewingDetail.id.toUpperCase()}`} onClose={() => setViewingDetail(null)} width={860}>
        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-emphasis)', borderRadius: 8, padding: 20 }}>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Case Metadata</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Origin Number</div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{viewingDetail.caller}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Location Vector</div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{viewingDetail.location.city}, {viewingDetail.location.countryCode}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Threat Classification</div>
                <div style={{ fontSize: 14, color: SCAM_TYPES[viewingDetail.type]?.color }}>{SCAM_TYPES[viewingDetail.type]?.label}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Confidence Score</div>
                <div style={{ fontSize: 14, color: 'var(--threat-live)', fontWeight: 'bold' }}>{viewingDetail.confidence}%</div>
              </div>
            </div>
            
            <h4 style={{ margin: '24px 0 12px 0', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Extracted Intel</h4>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(viewingDetail.entities).map(([k, v]) => v ? (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{v as string}</span>
                </div>
              ) : null)}
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-emphasis)', borderRadius: 8, padding: 20, flex: 1 }}>
                <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Evidence Transcript</h4>
                <div style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.6, fontStyle: 'italic', background: 'var(--bg-tertiary)', padding: 16, borderRadius: 6 }}>
                  "Target explicitly identified themselves as an authority figure and demanded immediate monetary transfer. Extracted parameters match cluster pattern."
                </div>
             </div>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Law Enforcement Secure Gateway" onClose={onClose} width={960}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: 16, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
          <div>
            <div style={{ color: '#22c55e', fontWeight: 600, fontSize: 14 }}>Connection Secure</div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'monospace' }}>Encrypted link established with INTERPOL Global DB</div>
          </div>
        </div>
        <button 
          onClick={handleSubmitToAgency} 
          disabled={selected.size === 0 || submitting}
          style={{ padding: '8px 16px', background: selected.size > 0 ? '#22c55e' : 'var(--bg-tertiary)', color: selected.size > 0 ? '#000' : 'var(--text-tertiary)', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: selected.size > 0 && !submitting ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
        >
          {submitting ? 'Transmitting...' : `Submit Selected (${selected.size})`}
        </button>
      </div>

      <div style={{ border: '1px solid var(--border-emphasis)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-emphasis)', padding: '12px 16px', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 24 }}></div>
          <div style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Threat Level</div>
          <div style={{ flex: 2, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Origin</div>
          <div style={{ flex: 1.5, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Entity</div>
          <div style={{ width: 100 }}></div>
        </div>

        {paged.map((inc, idx) => (
          <div key={inc.id} style={{ display: 'flex', background: idx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 16px', gap: 16, alignItems: 'center', transition: 'background 0.2s' }}>
            <div style={{ width: 24 }}>
              <input type="checkbox" checked={selected.has(inc.id)} onChange={() => { const ns = new Set(selected); ns.has(inc.id) ? ns.delete(inc.id) : ns.add(inc.id); setSelected(ns); }} style={{ accentColor: 'var(--accent)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ padding: '4px 8px', background: `rgba(${inc.risk > 80 ? '239,68,68' : '249,115,22'}, 0.15)`, color: inc.risk > 80 ? 'var(--threat-live)' : '#f97316', borderRadius: 4, fontSize: 11, fontWeight: 'bold' }}>
                {inc.risk}% {inc.risk > 80 ? 'CRITICAL' : 'HIGH'}
              </span>
            </div>
            <div style={{ flex: 2 }}>
              <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>{inc.caller}</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{inc.location.city}, {inc.location.country}</div>
            </div>
            <div style={{ flex: 1.5 }}>
              <div style={{ color: 'var(--text-primary)', fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{inc.entities.institution || 'Unknown'}</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{SCAM_TYPES[inc.type]?.short}</div>
            </div>
            <div style={{ width: 100, textAlign: 'right' }}>
              <button onClick={() => setViewingDetail(inc)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-emphasis)', color: 'var(--accent)', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
                View File
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Showing {paged.length} of {filtered.length} priority cases</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
            <button key={i+1} onClick={() => setPage(i+1)} style={{ padding: '4px 10px', background: page === i+1 ? 'var(--accent)' : 'var(--bg-secondary)', color: page === i+1 ? '#000' : 'var(--text-secondary)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
              {i+1}
            </button>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

/* ─── Settings ─── */
export function SSSettings({ onClose, onToast }: { onClose: () => void; onToast: (msg: string, v?: ToastVariant) => void }) {
  const [settings, setSettings] = useState({
    mapRotation: true, autoScroll: true,
    emailCluster: true, emailHighRisk: true, soundAlerts: false, desktopNotif: true,
    dataRetain: '7d', transcriptExport: false, leAccess: 'read-only',
  });

  type SettingsKey = keyof typeof settings;
  function set<K extends SettingsKey>(key: K, val: (typeof settings)[K]) {
    setSettings(s => ({ ...s, [key]: val }));
  }

  function Toggle({ k }: { k: SettingsKey }) {
    const on = settings[k] as boolean;
    return (
      <div onClick={() => set(k, !on as never)} style={{ width: 40, height: 22, borderRadius: 11, cursor: 'pointer', background: on ? 'var(--text-mono)' : 'var(--border-emphasis)', position: 'relative', transition: 'background 200ms', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#000000', transition: 'left 200ms' }} />
      </div>
    );
  }

  function SettingRow({ label, k }: { label: string; k: SettingsKey }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{label}</span>
        <Toggle k={k} />
      </div>
    );
  }

  return (
    <ModalShell title="Settings" onClose={onClose} width={480}>
      <div style={ss.group}>
        <div style={ss.groupLabel}>DISPLAY</div>
        <SettingRow label="Map auto-rotation" k="mapRotation" />
        <SettingRow label="Incident auto-scroll" k="autoScroll" />
      </div>
      <div style={ss.group}>
        <div style={ss.groupLabel}>NOTIFICATIONS</div>
        <SettingRow label="Email on new cluster" k="emailCluster" />
        <SettingRow label="Email on high risk (>85%)" k="emailHighRisk" />
        <SettingRow label="Sound alerts" k="soundAlerts" />
        <SettingRow label="Desktop notifications" k="desktopNotif" />
      </div>
      <div style={ss.group}>
        <div style={ss.groupLabel}>DATA & PRIVACY</div>
        <div style={{ padding: '9px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>Retain data older than</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['7d', '30d', '90d'].map(v => (
              <button key={v} onClick={() => set('dataRetain', v)} style={{ padding: '5px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: settings.dataRetain === v ? 'var(--accent)' : '#252d45', color: settings.dataRetain === v ? '#000000' : 'var(--text-secondary)' }}>{v}</button>
            ))}
          </div>
        </div>
        <SettingRow label="Include transcript in exports" k="transcriptExport" />
        <div style={{ padding: '9px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>LE access level</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['read-only', 'full'].map(v => (
              <button key={v} onClick={() => set('leAccess', v)} style={{ padding: '5px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', textTransform: 'capitalize', background: settings.leAccess === v ? 'var(--accent)' : '#252d45', color: settings.leAccess === v ? '#000000' : 'var(--text-secondary)' }}>{v}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={ss.group}>
        <div style={ss.groupLabel}>API & INTEGRATIONS</div>
        <div style={{ padding: '9px 0', display: 'flex', gap: 8 }}>
          <button onClick={() => onToast('API key copied to clipboard', 'success')} style={ss.apiBtn}>Show API Key</button>
          <button onClick={() => onToast('New API key generated', 'warning')} style={ss.apiBtn}>Regenerate</button>
          <button onClick={() => onToast('Webhook manager coming soon', 'default')} style={ss.apiBtn}>Manage Webhooks</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8 }}>
        <button onClick={() => onToast('Settings saved', 'success')} style={{ padding: '9px 20px', background: 'var(--accent)', color: '#000000', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
        <button onClick={onClose} style={{ padding: '9px 20px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-emphasis)', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
      </div>
    </ModalShell>
  );
}

/* ─── Help ─── */
export function SSHelp({ onClose }: { onClose: () => void }) {
  const sections: { title: string; items?: string[]; body?: string }[] = [
    { title: 'QUICK START', items: ['Click any dot on the map to view incident details', 'Use the Layers panel to filter by scam type', 'Time range buttons show incidents within that window', 'LE Portal: export incident data for law enforcement'] },
    { title: 'ENTITIES & DATA', body: 'Extracted entities are automatically parsed from agent conversation transcripts using AI function calls. Confidence scores indicate extraction accuracy.' },
    { title: 'RISK SCORING', body: 'Risk scores 0–100 computed by Gemini Flash classifier on call transcripts. Critical (>80): Red. Elevated (60–80): Orange. Moderate (40–60): Yellow. Low (<40): Green.' },
    { title: 'CLUSTER MATCHING', body: 'Incidents are clustered by location, scam type, and institution name patterns. Cluster size indicates how many similar calls have been detected in the same campaign.' },
  ];

  return (
    <ModalShell title="Help & Documentation" onClose={onClose} width={500}>
      {sections.map(({ title, items, body }) => (
        <div key={title} style={{ marginBottom: 20 }}>
          <div style={hs.sectionTitle}>{title}</div>
          {items ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {items.map((item, i) => (
                <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>{item}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{body}</p>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
        {['FAQ', 'GitHub', 'Contact'].map(l => (
          <button key={l} style={hs.linkBtn}>{l}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--border-emphasis)', alignSelf: 'center' }}>v0.1.0 · April 2026</span>
      </div>
    </ModalShell>
  );
}

const ms = {
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 150ms ease-out' },
  panel: { background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 10, maxHeight: '88vh', display: 'flex', flexDirection: 'column' as const, animation: 'scaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1)' },
  header: { padding: '18px 24px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  title: { fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  body: { padding: '20px 24px', overflowY: 'auto' as const, flex: 1 },
};

const ls = {
  filterInput: { background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '7px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', width: 140 } as React.CSSProperties,
  filterSelect: { background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '7px 10px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' } as React.CSSProperties,
  clearBtn: { background: 'transparent', border: '1px solid var(--border-emphasis)', borderRadius: 4, padding: '7px 12px', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10 },
  th: { flex: 1, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, userSelect: 'none' as const },
  td: { flex: 1, fontSize: 13 },
  viewBtn: { background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '4px 10px', fontSize: 11, color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit' },
  pageBtn: { padding: '5px 10px', borderRadius: 4, border: 'none', background: '#252d45', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 },
  exportBtn: { padding: '8px 16px', background: 'var(--accent)', color: '#000000', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  exportBtnSecondary: { padding: '8px 16px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-emphasis)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
};

const ss = {
  group: { marginBottom: 20 },
  groupLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, marginBottom: 4 },
  apiBtn: { padding: '7px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
};

const hs = {
  sectionTitle: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' as const, marginBottom: 8 },
  linkBtn: { padding: '6px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
};
