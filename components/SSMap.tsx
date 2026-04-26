'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl, Popup, MapRef, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { SCAM_TYPES } from '@/lib/data';
import type { Incident, LayerDefinition } from '@/lib/types';

interface SSMapProps {
  incidents: Incident[];
  layers: LayerDefinition[];
  onSelectIncident: (inc: Incident) => void;
  selectedId: string | undefined;
  timeRange: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function SSMap({ incidents, layers, onSelectIncident, selectedId, timeRange }: SSMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const mapRef = useRef<MapRef>(null);

  const enabledTypes = new Set(layers.filter(l => l.enabled).map(l => l.id));
  const now = Date.now();
  const rangeMs: Record<string, number> = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000, 'All': Infinity };
  const cutoff = rangeMs[timeRange] ?? Infinity;

  const visibleIncidents = useMemo(() => {
    return incidents.filter(i =>
      enabledTypes.has(i.type) && (now - i.timestamp) < cutoff
    );
  }, [incidents, enabledTypes, now, cutoff]);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Determine the focus target: selected incident or the newest live incident
    let target = selectedId ? visibleIncidents.find(i => i.id === selectedId) : null;
    if (!target) {
      target = visibleIncidents.find(i => i.status === 'live');
    }

    if (target) {
      mapRef.current.flyTo({
        center: [target.location.lng, target.location.lat],
        zoom: 4,
        speed: 0.8,
        curve: 1,
        essential: true,
      });
    }
  }, [selectedId, visibleIncidents]);

  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleIncidents.forEach(inc => {
      counts[inc.location.countryCode] = (counts[inc.location.countryCode] || 0) + 1;
    });
    return counts;
  }, [visibleIncidents]);

  const fillPaint = useMemo(() => {
    const matchExpr: any[] = ['match', ['get', 'iso_a2']];
    let hasEntries = false;
    for (const [code, count] of Object.entries(countryCounts)) {
      if (count > 0) {
        matchExpr.push(code);
        if (count >= 10) matchExpr.push('#ef4444');
        else if (count >= 5) matchExpr.push('#f97316');
        else if (count >= 2) matchExpr.push('#eab308');
        else matchExpr.push('#3b82f6');
        hasEntries = true;
      }
    }
    matchExpr.push('transparent'); // default color
    
    return {
      'fill-color': hasEntries ? matchExpr : 'transparent',
      'fill-opacity': 0.15
    };
  }, [countryCounts]);

  function getMarkerColor(incident: Incident): string {
    return SCAM_TYPES[incident.type]?.color ?? 'var(--text-tertiary)';
  }

  function getMarkerOpacity(incident: Incident): number {
    const age = now - incident.timestamp;
    if (incident.status === 'live') return 1;
    if (age < 86400000) return 0.9;
    if (age < 172800000) return 0.7;
    if (age < 604800000) return 0.5;
    return 0.3;
  }

  return (
    <div style={{ flex: 1, position: 'relative', background: '#050505', width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 1.5
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        
        <Source id="countries" type="geojson" data="https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson">
          <Layer
            id="country-fills"
            type="fill"
            paint={fillPaint as any}
          />
        </Source>

        {visibleIncidents.map(incident => {
          const color = getMarkerColor(incident);
          const opacity = getMarkerOpacity(incident);
          const isLive = incident.status === 'live';
          const isSelected = selectedId === incident.id;
          const isHovered = hoveredId === incident.id;
          
          return (
            <Marker
              key={incident.id}
              longitude={incident.location.lng}
              latitude={incident.location.lat}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                onSelectIncident(incident);
              }}
              style={{ zIndex: isSelected || isHovered || isLive ? 1 : 0 }}
            >
              <div
                onMouseEnter={() => setHoveredId(incident.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  width: isSelected || isHovered ? 16 : 12,
                  height: isSelected || isHovered ? 16 : 12,
                  backgroundColor: color,
                  borderRadius: '50%',
                  opacity,
                  cursor: 'pointer',
                  border: isSelected ? '2px solid white' : isLive ? '2px solid white' : 'none',
                  boxShadow: isLive || isHovered ? `0 0 10px ${color}` : 'none',
                  transition: 'all 0.2s ease-in-out',
                  position: 'relative'
                }}
              >
                {isLive && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    border: `2px solid ${color}`,
                    opacity: 0.5,
                    animation: 'markerPulse 1.5s infinite',
                    pointerEvents: 'none'
                  }} />
                )}
              </div>
            </Marker>
          );
        })}

        {hoveredId && visibleIncidents.find(i => i.id === hoveredId) && (() => {
          const inc = visibleIncidents.find(i => i.id === hoveredId)!;
          return (
            <Popup
              longitude={inc.location.lng}
              latitude={inc.location.lat}
              anchor="bottom"
              offset={15}
              closeButton={false}
              closeOnClick={false}
              maxWidth="250px"
              style={{ zIndex: 100 }}
            >
              <div style={{ padding: '4px', fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: SCAM_TYPES[inc.type]?.color ?? '#fff', marginBottom: 2 }}>
                  {SCAM_TYPES[inc.type]?.short ?? 'UNKNOWN'}
                </div>
                <div style={{ color: '#aaa', marginBottom: 2 }}>
                  {inc.location.city}, {inc.location.countryCode} · Risk {inc.risk}%
                </div>
                {inc.cluster && (
                  <div style={{ color: '#888' }}>{inc.cluster.count} cluster matches</div>
                )}
              </div>
            </Popup>
          );
        })()}
      </Map>

      <div style={s.legend}>
        <div style={{ fontSize: 10, color: '#888888', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>Legend</div>
        {[
          { color: '#dc2626', label: 'Live / Active', pulse: true },
          { color: '#f97316', label: 'Recent (24h)', pulse: false },
          { color: '#555555', label: 'Older', pulse: false },
        ].map(({ color, label, pulse }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: pulse ? `0 0 6px ${color}` : 'none' }} />
            <span style={{ fontSize: 10, color: '#e0e0e0' }}>{label}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes markerPulse {
          0% { width: 12px; height: 12px; opacity: 1; }
          100% { width: 40px; height: 40px; opacity: 0; }
        }
        .mapboxgl-popup-content {
          background: #111111;
          color: #e0e0e0;
          border: 1px solid #333333;
        }
        .mapboxgl-popup-tip {
          border-top-color: #111111;
          border-bottom-color: #111111;
        }
      `}</style>
    </div>
  );
}

const s = {
  legend: { position: 'absolute' as const, bottom: 24, left: 16, background: 'rgba(17, 17, 17, 0.85)', border: '1px solid #333333', borderRadius: 6, padding: '10px 12px', backdropFilter: 'blur(4px)', zIndex: 10 },
};