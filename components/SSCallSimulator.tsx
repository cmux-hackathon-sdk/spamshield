import React, { useState, useEffect, useRef } from 'react';

interface Event {
  type: 'agent_response' | 'entity_extracted' | 'user';
  text?: string;
  entity?: {
    type: string;
    value: string;
    confidence: number;
  };
}

export function SSCallSimulator({ onClose }: { onClose: () => void }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wsUrl = (process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000').replace('http', 'ws') + '/ws/call';
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setConnected(true);
      setEvents([{ type: 'agent_response', text: 'System: Call connected to decoy agent.' }]);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents((prev) => [...prev, data]);
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };

    ws.current.onclose = () => {
      setConnected(false);
      setEvents((prev) => [...prev, { type: 'agent_response', text: 'System: Call disconnected.' }]);
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !connected) return;

    setEvents((prev) => [...prev, { type: 'user', text: input }]);
    ws.current?.send(JSON.stringify({ text: input }));
    setInput('');
  };

  const entities = events
    .filter(e => e.type === 'entity_extracted' && e.entity)
    .map(e => e.entity);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 5, 5, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
        borderRadius: 12, width: 800, height: 600, display: 'flex', overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: connected ? 'var(--threat-low)' : 'var(--threat-critical)' }} />
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Live Call Simulator</span>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map((ev, i) => {
              if (ev.type === 'entity_extracted') return null;
              const isUser = ev.type === 'user';
              return (
                <div key={i} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, textAlign: isUser ? 'right' : 'left' }}>
                    {isUser ? 'You (Scammer)' : 'Decoy Agent'}
                  </div>
                  <div style={{
                    background: isUser ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: isUser ? '#000000' : 'var(--text-primary)',
                    padding: '10px 14px', borderRadius: 8, fontSize: 14,
                    border: isUser ? 'none' : '1px solid var(--border-subtle)'
                  }}>
                    {ev.text}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSend} style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type to talk to the decoy..."
              disabled={!connected}
              style={{
                flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', padding: '10px 14px', borderRadius: 6, outline: 'none'
              }}
            />
            <button type="submit" disabled={!connected} style={{
              background: 'var(--accent)', color: '#000000', border: 'none', borderRadius: 6,
              padding: '0 20px', fontWeight: 600, cursor: connected ? 'pointer' : 'not-allowed', opacity: connected ? 1 : 0.5
            }}>Send</button>
          </form>
        </div>

        <div style={{ width: 300, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Extracted Entities
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {entities.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                Listening for entities...
              </div>
            ) : (
              entities.map((ent, i) => (
                <div key={i} style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-emphasis)',
                  borderRadius: 6, padding: 12, marginBottom: 10, animation: 'scaleIn 200ms ease-out'
                }}>
                  <div style={{ fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                    {ent?.type?.replace('_', ' ')}
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14, fontFamily: 'monospace' }}>
                    {ent?.value}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
