'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { MOCK_INCIDENTS, LAYER_DEFINITIONS, SCAM_TYPES } from '@/lib/data';
import { SSHeader } from '@/components/SSHeader';
import { SSSidebar } from '@/components/SSSidebar';
import { SSMap } from '@/components/SSMap';
import { SSDrawer } from '@/components/SSDrawer';
import { SSLiveFeed } from '@/components/SSLiveFeed';
import { SSIncidentList } from '@/components/SSIncidentList';
import { SSLEPortal, SSSettings, SSHelp } from '@/components/SSModals';
import { SSCallSimulator } from '@/components/SSCallSimulator';
import { SSToast, useToasts } from '@/components/SSToast';
import type { Incident, LayerDefinition, ScamType } from '@/lib/types';

type View = 'map' | 'list';
type Modal = 'le' | 'settings' | 'help' | 'simulator' | null;

export default function Page() {
  const [incidents, setIncidents] = useState<Incident[]>([...MOCK_INCIDENTS]);
  const [layers, setLayers] = useState<LayerDefinition[]>([...LAYER_DEFINITIONS]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [timeRange, setTimeRange] = useState('All');
  const [modal, setModal] = useState<Modal>(null);
  const [view, setView] = useState<View>('map');
  const [simulating, setSimulating] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addIncident = useCallback((incident: Incident) => {
    setIncidents(prev => [incident, ...prev.filter(item => item.id !== incident.id)].slice(0, 250));
  }, []);

  // Load seeded FTC incidents from the backend, while keeping mock data as a demo fallback.
  useEffect(() => {
    let cancelled = false;

    async function loadIncidents() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/api/frontend/incidents?limit=250`);
        if (!response.ok) throw new Error(`Backend returned ${response.status}`);
        const data = await response.json() as Incident[];
        if (!cancelled && data.length > 0) {
          setIncidents(data);
          addToast(`Loaded ${data.length} FTC robocall incidents`, 'success');
        }
      } catch (error) {
        console.warn('Using mock incidents because backend is unavailable:', error);
      }
    }

    loadIncidents();
    return () => { cancelled = true; };
  }, [addToast]);


  const playAlertSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1108.73, now + 0.1); // C#6
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Audio playback failed', e);
    }
  }, []);

  // Subscribe to backend WebSocket incident broadcasts.
  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;

    function connect() {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws/live';
      ws = new WebSocket(wsUrl);

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'incident_created') {
            const incident = data.incident as Incident;
            addIncident(incident);
            addToast(`New ${SCAM_TYPES[incident.type]?.short ?? 'SCAM'} incident — ${incident.location.city}`, 'danger');
            playAlertSound();
          } 
          else if (data.type === 'entity_extracted' && data.incident_id) {
            setIncidents(prev => prev.map(inc => {
              if (inc.id === data.incident_id) {
                const newEnts = { ...inc.entities };
                const t = data.entity.type;
                const v = data.entity.value;
                if (t === 'institution' || t === 'institution_name') newEnts.institution = v;
                if (t === 'case_id') newEnts.caseId = v;
                if (t === 'payment_method') newEnts.payment = v;
                if (t === 'callback_number') newEnts.callback = v;
                return { ...inc, entities: newEnts };
              }
              return inc;
            }));
            addToast(`Intel Extracted: ${data.entity.value}`, 'success');
          }
        } catch (error) {
          console.warn('Ignored malformed WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        if (closed) return;
        reconnectTimer.current = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      closed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws?.close();
    };
  }, [addIncident, addToast, playAlertSound]);

  // Age live → recent after 5 min
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      setIncidents(prev => prev.map(i =>
        i.status === 'live' && now - i.timestamp > 300000 ? { ...i, status: 'recent' } : i
      ));
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  function handleLayerToggle(id: ScamType) {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l));
  }

  function handleSelectIncident(inc: Incident) {
    setSelectedIncident(prev => prev?.id === inc.id ? null : inc);
  }

  async function handleSimulate() {
    setSimulating(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
      const hotspots = [
        { caller_number: '+234 567 890 123', caller_city: 'Lagos', caller_country: 'NG' },
        { caller_number: '+91 981 234 5678', caller_city: 'Mumbai', caller_country: 'IN' },
        { caller_number: '+63 917 234 5678', caller_city: 'Manila', caller_country: 'PH' },
        { caller_number: '+1 646 555 0182', caller_city: 'New York', caller_country: 'US' },
      ];
      const pick = hotspots[Math.floor(Math.random() * hotspots.length)];
      const params = new URLSearchParams(pick);
      const response = await fetch(`${backendUrl}/api/call/start?${params.toString()}`, { method: 'POST' });
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const incident = await response.json() as Incident;
      addIncident(incident);
      addToast(`Simulated: ${SCAM_TYPES[incident.type]?.short} in ${incident.location.city}`, 'danger');
    } catch (error) {
      console.error('Simulation failed:', error);
      addToast('Backend simulation failed. Is FastAPI running?', 'danger');
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'var(--text-primary)' }}>
      <SSHeader
        incidents={incidents}
        onHelp={() => setModal('help')}
        onSettings={() => setModal('settings')}
        onRefresh={() => addToast('Data refreshed', 'success')}
        onLEPortal={() => setModal('le')}
        view={view}
        onViewChange={setView}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <SSSidebar
          layers={layers}
          onLayerToggle={handleLayerToggle}
          incidents={incidents}
          timeRange={timeRange}
          onTimeRange={setTimeRange}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {view === 'map' ? (
            <>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <SSMap
                  incidents={incidents}
                  layers={layers}
                  onSelectIncident={handleSelectIncident}
                  selectedId={selectedIncident?.id}
                  timeRange={timeRange}
                />
                {selectedIncident && (
                  <SSDrawer
                    incident={selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                    onToast={addToast}
                  />
                )}

                {/* Live Call Intercept FAB */}
                <button
                  onClick={() => setModal('simulator')}
                  style={{
                    position: 'absolute', bottom: 20, right: 180, zIndex: 40,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)', border: '1px solid var(--border-emphasis)', borderRadius: 8,
                    padding: '10px 18px', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    transition: 'all 200ms', letterSpacing: '0.03em',
                  }}
                >
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--threat-live)' }} />
                  Live Intercept
                </button>

                {/* Simulate Call FAB */}
                <button
                  onClick={handleSimulate}
                  disabled={simulating}
                  style={{
                    position: 'absolute', bottom: 20, right: 20, zIndex: 40,
                    background: simulating ? '#1a2a4a' : 'var(--accent)',
                    color: '#000000', border: 'none', borderRadius: 8,
                    padding: '10px 18px', fontSize: 13, fontWeight: 700,
                    cursor: simulating ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 20px rgba(30,144,255,0.4)',
                    transition: 'all 200ms', letterSpacing: '0.03em',
                  }}
                >
                  {simulating ? (
                    <>
                      <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#000000', borderRadius: '50%', animation: 'spin 700ms linear infinite' }} />
                      Simulating…
                    </>
                  ) : (
                    <>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--threat-live)', boxShadow: '0 0 6px var(--threat-live)', animation: 'pulse-dot 1s ease-in-out infinite' }} />
                      Simulate Call
                    </>
                  )}
                </button>
              </div>

              <SSLiveFeed
                incidents={incidents}
                selectedId={selectedIncident?.id}
                onSelectIncident={handleSelectIncident}
              />
            </>
          ) : (
            <SSIncidentList
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              selectedId={selectedIncident?.id}
            />
          )}
        </div>
      </div>

      {modal === 'le' && (
        <SSLEPortal incidents={incidents} onClose={() => setModal(null)} onToast={addToast} />
      )}
      {modal === 'settings' && (
        <SSSettings onClose={() => setModal(null)} onToast={addToast} />
      )}
      {modal === 'help' && (
        <SSHelp onClose={() => setModal(null)} />
      )}

      {modal === 'simulator' && (
        <SSCallSimulator onClose={() => setModal(null)} />
      )}

      <SSToast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
