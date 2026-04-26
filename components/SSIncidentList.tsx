'use client';

import { useState } from 'react';
import { SCAM_TYPES, getRiskColor } from '@/lib/data';
import type { Incident, ScamType } from '@/lib/types';

interface SSIncidentListProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  selectedId: string | undefined;
}

type SortCol = 'timestamp' | 'risk' | 'country' | 'type';

export function SSIncidentList({ incidents, onSelectIncident, selectedId }: SSIncidentListProps) {
  const [sort, setSort] = useState<{ col: SortCol; dir: number }>({ col: 'timestamp', dir: -1 });
  const [filterType, setFilterType] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [search, setSearch] = useState('');

  function handleSort(col: SortCol) {
    setSort(s => s.col === col ? { col, dir: s.dir * -1 } : { col, dir: -1 });
  }

  const filtered = incidents
    .filter(i => {
      if (filterType && i.type !== filterType) return false;
      if (filterRisk === 'critical' && i.risk < 80) return false;
      if (filterRisk === 'elevated' && (i.risk < 60 || i.risk >= 80)) return false;
      if (filterRisk === 'moderate' && (i.risk < 40 || i.risk >= 60)) return false;
      if (filterRisk === 'low' && i.risk >= 40) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!i.location.city.toLowerCase().includes(q) &&
            !i.location.country.toLowerCase().includes(q) &&
            !i.caller.includes(q) &&
            !(i.entities.caseId ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const d = sort.dir;
      if (sort.col === 'timestamp') return (a.timestamp - b.timestamp) * d;
      if (sort.col === 'risk') return (a.risk - b.risk) * d;
      if (sort.col === 'country') return a.location.country.localeCompare(b.location.country) * d;
      if (sort.col === 'type') return a.type.localeCompare(b.type) * d;
      return 0;
    });

  function ColHeader({ col, label, flex = 1 }: { col: SortCol; label: string; flex?: number }) {
    const active = sort.col === col;
    return (
      <div onClick={() => handleSort(col)} style={{ ...s.th, flex, color: active ? 'var(--text-primary)' : '#5a6a7a', cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        <span style={{ opacity: active ? 1 : 0.3, fontSize: 10 }}>{active && sort.dir === -1 ? '↓' : '↑'}</span>
      </div>
    );
  }

  return (
    <div style={s.root}>
      <div style={s.toolbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={s.toolbarLabel}>ALL INCIDENTS</span>
          <span style={s.countChip}>{filtered.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
          <input
            placeholder="Search city, caller, case ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={s.searchInput}
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={s.select}>
            <option value="">All types</option>
            {(Object.keys(SCAM_TYPES) as ScamType[]).filter(k => k !== 'unknown').map(k => (
              <option key={k} value={k}>{SCAM_TYPES[k].label}</option>
            ))}
          </select>
          <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={s.select}>
            <option value="">All risk levels</option>
            <option value="critical">Critical (80+)</option>
            <option value="elevated">Elevated (60–79)</option>
            <option value="moderate">Moderate (40–59)</option>
            <option value="low">Low (&lt;40)</option>
          </select>
          {(filterType || filterRisk || search) && (
            <button onClick={() => { setFilterType(''); setFilterRisk(''); setSearch(''); }} style={s.clearBtn}>Clear</button>
          )}
        </div>
      </div>

      <div style={s.tableHead}>
        <div style={{ width: 10, flexShrink: 0 }} />
        <ColHeader col="timestamp" label="Date / Time" flex={1.4} />
        <ColHeader col="country" label="Location" flex={1.2} />
        <ColHeader col="type" label="Type" flex={1} />
        <div style={{ ...s.th, flex: 1.4 }}>Caller</div>
        <ColHeader col="risk" label="Risk" flex={0.7} />
        <div style={{ ...s.th, flex: 1 }}>Case ID</div>
        <div style={{ ...s.th, flex: 1 }}>Status</div>
        <div style={{ ...s.th, flex: 0.5 }}>LE</div>
      </div>

      <div style={s.tableBody}>
        {filtered.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            No incidents match the current filters.
          </div>
        )}
        {filtered.map((inc, idx) => {
          const isSelected = selectedId === inc.id;
          const riskColor = getRiskColor(inc.risk);
          const t = SCAM_TYPES[inc.type] ?? SCAM_TYPES.unknown;
          const isLive = inc.status === 'live';

          return (
            <div
              key={inc.id}
              onClick={() => onSelectIncident(inc)}
              style={{
                ...s.row,
                background: isSelected ? 'rgba(255,255,255,0.04)' : idx % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                borderLeft: isSelected ? '2px solid #5a7a9a' : '2px solid transparent',
              }}
            >
              <div style={{ width: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isLive && <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: 'var(--threat-live)', boxShadow: '0 0 4px var(--threat-live)', animation: 'pulse-dot 1.2s ease-in-out infinite' }} />}
              </div>

              <div style={{ flex: 1.4 }}>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {new Date(inc.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>
                  {new Date(inc.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div style={{ flex: 1.2 }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{inc.location.city}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{inc.location.country}</div>
              </div>

              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', padding: '3px 7px', borderRadius: 3, background: '#151d28', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace' }}>
                  {t.short}
                </span>
              </div>

              <div style={{ flex: 1.4, fontSize: 12, fontFamily: 'monospace', color: '#6a7a8a' }}>{inc.caller}</div>

              <div style={{ flex: 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 3, background: 'var(--border-subtle)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${inc.risk}%`, background: riskColor, borderRadius: 1 }} />
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: riskColor, minWidth: 32, textAlign: 'right' as const }}>{inc.risk}%</span>
                </div>
              </div>

              <div style={{ flex: 1, fontSize: 11, fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>{inc.entities.caseId ?? '—'}</div>

              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', color: isLive ? 'var(--threat-live)' : 'var(--text-tertiary)', textTransform: 'uppercase' as const }}>
                  {isLive ? 'Live' : 'Recent'}
                </span>
              </div>

              <div style={{ flex: 0.5 }}>
                {inc.leExported
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5a7a5a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  : <span style={{ color: 'var(--border-emphasis)', fontSize: 12 }}>—</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={s.footer}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Showing {filtered.length} of {incidents.length} incidents</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
          Sorted by {sort.col} {sort.dir === -1 ? '(newest first)' : '(oldest first)'}
        </span>
      </div>
    </div>
  );
}

const s = {
  root: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', background: 'var(--bg-primary)' },
  toolbar: { height: 48, padding: '0 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'var(--bg-primary)' },
  toolbarLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const },
  countChip: { fontSize: 11, fontFamily: 'monospace', background: '#141c28', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 10, border: '1px solid var(--border-subtle)' },
  searchInput: { background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '6px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', width: 220 } as React.CSSProperties,
  select: { background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '6px 10px', fontSize: 12, color: 'var(--text-secondary)', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' } as React.CSSProperties,
  clearBtn: { background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '5px 12px', fontSize: 11, color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'inherit' },
  tableHead: { display: 'flex', alignItems: 'center', padding: '0 20px', height: 36, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', flexShrink: 0, gap: 12 },
  th: { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const },
  tableBody: { flex: 1, overflowY: 'auto' as const },
  row: { display: 'flex', alignItems: 'center', padding: '10px 20px', gap: 12, cursor: 'pointer', borderBottom: '1px solid var(--bg-tertiary)', transition: 'background 120ms' },
  footer: { height: 36, padding: '0 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-primary)' },
};
