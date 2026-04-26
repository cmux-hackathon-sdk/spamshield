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
  const [sort, setSort] = useState({ col: 'risk', dir: -1 });
  const [selected, setSelected] = useState(new Set<string>());
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const filtered = incidents
    .filter(i => {
      if (filter.country && !i.location.country.toLowerCase().includes(filter.country.toLowerCase())) return false;
      if (filter.type && i.type !== filter.type) return false;
      if (filter.risk === 'high' && i.risk < 80) return false;
      if (filter.risk === 'elevated' && (i.risk < 60 || i.risk >= 80)) return false;
      if (filter.risk === 'moderate' && (i.risk < 40 || i.risk >= 60)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort.col === 'risk') return (a.risk - b.risk) * sort.dir;
      if (sort.col === 'date') return (a.timestamp - b.timestamp) * sort.dir;
      if (sort.col === 'country') return a.location.country.localeCompare(b.location.country) * sort.dir;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function toggleSelect(id: string) {
    setSelected(s => { const ns = new Set(s); ns.has(id) ? ns.delete(id) : ns.add(id); return ns; });
  }
  function toggleAll() {
    setSelected(selected.size === paged.length ? new Set() : new Set(paged.map(i => i.id)));
  }
  function handleSort(col: string) {
    setSort(s => s.col === col ? { col, dir: s.dir * -1 } : { col, dir: -1 });
  }

  const SortIcon = ({ col }: { col: string }) => (
    <span style={{ marginLeft: 4, opacity: sort.col === col ? 1 : 0.3 }}>
      {sort.col === col && sort.dir === -1 ? '↓' : '↑'}
    </span>
  );

  return (
    <ModalShell title="Law Enforcement Portal" onClose={onClose} width={860}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Country..." value={filter.country} onChange={e => { setFilter(f => ({ ...f, country: e.target.value })); setPage(1); }} style={ls.filterInput} />
        <select value={filter.type} onChange={e => { setFilter(f => ({ ...f, type: e.target.value })); setPage(1); }} style={ls.filterSelect}>
          <option value="">All Types</option>
          {(Object.keys(SCAM_TYPES) as ScamType[]).filter(k => k !== 'unknown').map(k => (
            <option key={k} value={k}>{SCAM_TYPES[k].label}</option>
          ))}
        </select>
        <select value={filter.risk} onChange={e => { setFilter(f => ({ ...f, risk: e.target.value })); setPage(1); }} style={ls.filterSelect}>
          <option value="">All Risk Levels</option>
          <option value="high">Critical (80+)</option>
          <option value="elevated">Elevated (60-79)</option>
          <option value="moderate">Moderate (40-59)</option>
        </select>
        {(filter.country || filter.type || filter.risk) && (
          <button onClick={() => setFilter({ country: '', type: '', risk: '' })} style={ls.clearBtn}>Clear</button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)', alignSelf: 'center' }}>
          {filtered.length} incident{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ ...ls.tableRow, background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: 28 }}>
            <input type="checkbox" checked={selected.size === paged.length && paged.length > 0} onChange={toggleAll} style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
          </div>
          {[['country', 'Country / City'], ['date', 'Date'], ['type', 'Type'], ['risk', 'Risk']].map(([col, label]) => (
            <div key={col} style={{ ...ls.th, cursor: 'pointer' }} onClick={() => handleSort(col)}>
              {label}<SortIcon col={col} />
            </div>
          ))}
          <div style={ls.th}>Case ID</div>
          <div style={ls.th}>Entity</div>
          <div style={{ ...ls.th, flex: 0.6 }}>Action</div>
        </div>

        {paged.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No incidents match filters</div>
        ) : paged.map((inc, idx) => {
          const color = getRiskColor(inc.risk);
          const t = SCAM_TYPES[inc.type] ?? SCAM_TYPES.unknown;
          return (
            <div key={inc.id} style={{ ...ls.tableRow, background: idx % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 28 }}>
                <input type="checkbox" checked={selected.has(inc.id)} onChange={() => toggleSelect(inc.id)} style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
              </div>
              <div style={ls.td}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{inc.location.country}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{inc.location.city}</div>
              </div>
              <div style={{ ...ls.td, fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(inc.timestamp).toLocaleDateString()}</div>
              <div style={ls.td}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.color, background: `${t.color}18`, padding: '2px 7px', borderRadius: 10 }}>{t.short}</span>
              </div>
              <div style={{ ...ls.td, fontFamily: 'monospace', fontWeight: 700, color }}>{inc.risk}%</div>
              <div style={{ ...ls.td, fontFamily: 'monospace', fontSize: 11, color: 'var(--text-mono)' }}>{inc.entities.caseId ?? '—'}</div>
              <div style={{ ...ls.td, fontSize: 11, color: 'var(--text-secondary)' }}>{inc.entities.institution ?? inc.entities.badge ?? '—'}</div>
              <div style={{ ...ls.td, flex: 0.6 }}>
                <button onClick={() => onToast(`Exported incident #${inc.id}`, 'success')} style={ls.viewBtn}>Export</button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={ls.pageBtn}>‹ Prev</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ ...ls.pageBtn, background: page === p ? 'var(--accent)' : '#252d45', color: page === p ? '#000000' : 'var(--text-secondary)' }}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={ls.pageBtn}>Next ›</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {selected.size > 0 && (
          <button onClick={() => onToast(`Exported ${selected.size} incidents`, 'success')} style={ls.exportBtn}>Export selected ({selected.size})</button>
        )}
        <button onClick={() => onToast('JSON export ready', 'success')} style={ls.exportBtnSecondary}>Export JSON</button>
        <button onClick={() => onToast('PDF generated', 'success')} style={ls.exportBtnSecondary}>Export PDF</button>
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
