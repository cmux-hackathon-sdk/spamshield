'use client';

import { useState } from 'react';
import { SCAM_TYPES } from '@/lib/data';
import type { Incident, LayerDefinition, ScamType } from '@/lib/types';

interface SSSidebarProps {
  layers: LayerDefinition[];
  onLayerToggle: (id: ScamType) => void;
  incidents: Incident[];
  timeRange: string;
  onTimeRange: (r: string) => void;
}

export function SSSidebar({ layers, onLayerToggle, incidents, timeRange, onTimeRange }: SSSidebarProps) {
  const [layerSearch, setLayerSearch] = useState('');

  const filtered = layers.filter(l => l.label.toLowerCase().includes(layerSearch.toLowerCase()));

  const now = Date.now();
  const rangeMs: Record<string, number> = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000, 'All': Infinity };
  const cutoff = rangeMs[timeRange] ?? Infinity;
  const visibleIncidents = incidents.filter(i => (now - i.timestamp) < cutoff);

  const typeCounts: Record<string, number> = {};
  visibleIncidents.forEach(i => { typeCounts[i.type] = (typeCounts[i.type] || 0) + 1; });
  const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxType = topTypes[0]?.[1] || 1;

  const regionCounts: Record<string, number> = {};
  visibleIncidents.forEach(i => { regionCounts[i.location.country] = (regionCounts[i.location.country] || 0) + 1; });
  const topRegions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxRegion = topRegions[0]?.[1] || 1;

  const last24h = incidents.filter(i => (now - i.timestamp) < 86400000).length;
  const timeRanges = ['1h', '6h', '24h', '7d', 'All'];

  return (
    <aside style={s.root}>
      <div style={s.section}>
        <div style={s.sectionHeader}><span style={s.sectionLabel}>LAYERS</span></div>
        <input
          style={s.layerSearch}
          placeholder="Search layers..."
          value={layerSearch}
          onChange={e => setLayerSearch(e.target.value)}
        />
        <div style={s.layerList}>
          {filtered.map(layer => (
            <div key={layer.id} style={s.layerRow} title={layer.label} onClick={() => onLayerToggle(layer.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 3,
                  border: `1px solid ${layer.enabled ? layer.color : 'var(--border-emphasis)'}`,
                  background: layer.enabled ? `${layer.color}22` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 150ms',
                }}>
                  {layer.enabled && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke={layer.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: layer.enabled ? layer.color : 'var(--border-emphasis)',
                  boxShadow: layer.enabled ? `0 0 4px ${layer.color}` : 'none',
                  flexShrink: 0, transition: 'all 150ms',
                }} />
                <span style={{
                  fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
                  color: layer.enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  textTransform: 'uppercase', transition: 'color 150ms',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{layer.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.divider} />

      <div style={s.section}>
        <div style={s.sectionHeader}><span style={s.sectionLabel}>GLOBAL SITUATION</span></div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' as const }}>Time Range</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
            {timeRanges.map(tr => (
              <button key={tr} onClick={() => onTimeRange(tr)} style={{
                fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 4, cursor: 'pointer', border: 'none',
                background: timeRange === tr ? 'var(--accent)' : '#252d45',
                color: timeRange === tr ? '#000000' : 'var(--text-secondary)',
                transition: 'all 150ms', fontFamily: 'inherit', letterSpacing: '0.04em',
              }}>{tr}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={s.statRow}><span style={s.statLabel}>Incidents</span><span style={s.statValue}>{visibleIncidents.length}</span></div>
          <div style={s.statRow}><span style={s.statLabel}>Last 24h</span><span style={s.statValue}>{last24h}</span></div>
          <div style={s.statRow}>
            <span style={s.statLabel}>Active now</span>
            <span style={{ ...s.statValue, color: 'var(--threat-live)' }}>{incidents.filter(i => i.status === 'live').length}</span>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={s.miniHeader}>Top types</div>
          {topTypes.map(([type, count]) => {
            const t = SCAM_TYPES[type as ScamType] ?? SCAM_TYPES.unknown;
            return (
              <div key={type} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{t.short}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9aafc0' }}>{count}</span>
                </div>
                <div style={{ height: 2, background: 'var(--border-subtle)', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / maxType) * 100}%`, background: '#4a5a72', borderRadius: 1, transition: 'width 400ms ease-out' }} />
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div style={s.miniHeader}>Top regions</div>
          {topRegions.map(([country, count]) => (
            <div key={country} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>{country}</span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9aafc0', flexShrink: 0 }}>{count}</span>
              </div>
              <div style={{ height: 2, background: 'var(--border-subtle)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(count / maxRegion) * 100}%`, background: '#4a5a72', borderRadius: 1, transition: 'width 400ms ease-out' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 10, color: 'var(--border-emphasis)', letterSpacing: '0.04em' }}>SpamShield Intelligence v0.1</div>
        <div style={{ fontSize: 10, color: 'var(--border-emphasis)', marginTop: 2 }}>Real-time global scam monitor</div>
      </div>
    </aside>
  );
}

const s = {
  root: { width: 220, flexShrink: 0, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' as const, overflowY: 'auto' as const, overflowX: 'hidden' as const },
  section: { padding: '14px 14px 10px' },
  sectionHeader: { marginBottom: 10 },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const },
  layerSearch: { width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '6px 10px', fontSize: 11, color: 'var(--text-primary)', outline: 'none', marginBottom: 8, boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  layerList: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  layerRow: { display: 'flex', alignItems: 'center', padding: '5px 6px', borderRadius: 4, cursor: 'pointer', transition: 'background 150ms' },
  divider: { height: 1, background: 'var(--border-subtle)', margin: '0 14px' },
  statRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statLabel: { fontSize: 11, color: 'var(--text-tertiary)' },
  statValue: { fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 },
  miniHeader: { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, marginBottom: 8 },
};
