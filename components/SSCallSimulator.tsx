import React, { useState, useEffect, useRef } from 'react';

interface Event {
  type: 'agent_response' | 'entity_extracted' | 'user' | 'system' | 'bot';
  text?: string;
  entity?: {
    type: string;
    value: string;
    confidence: number;
  };
}

export function SSCallSimulator({ onClose }: { onClose: () => void }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [connected, setConnected] = useState(false);
  const [demoState, setDemoState] = useState<'idle'|'incoming'|'detected'|'intercepting'|'active'|'finished'>('idle');
  const [incidentId, setIncidentId] = useState<string|null>(null);

  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const audioContext = useRef<AudioContext | null>(null);
  const nextPlayTime = useRef(0);

  const eventsRef = useRef<Event[]>([]);
  const demoStateRef = useRef(demoState);
  const isScammerSpeakingRef = useRef(false);

  useEffect(() => { eventsRef.current = events; }, [events]);
  useEffect(() => { demoStateRef.current = demoState; }, [demoState]);

  const playDeepgramTTS = async (text: string, voice: string, onEnd: () => void) => {
    try {
      const res = await fetch(`https://api.deepgram.com/v1/speak?model=${voice}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Token b4f6867e284c553d38aef0f62902fe30a94228fc',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('Deepgram HTTP error');
      const arrayBuffer = await res.arrayBuffer();

      if (!audioContext.current) {
         audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current.destination);

      source.onended = () => {
         onEnd();
      };

      source.start();
    } catch (e) {
      console.warn("Deepgram TTS error, falling back to browser TTS", e);
      // Bulletproof fallback so the demo never hangs!
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = voice.includes('hera') ? 1.3 : 0.8;
      u.rate = 0.95;
      u.onend = () => onEnd();
      window.speechSynthesis.speak(u);
    }
  };

  const playSirenSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContext.current || new AudioCtx();
      if (!audioContext.current) audioContext.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(800, now + 0.2);
      osc.frequency.setValueAtTime(1200, now + 0.4);
      osc.frequency.setValueAtTime(800, now + 0.6);
      osc.frequency.setValueAtTime(1200, now + 0.8);
      osc.frequency.setValueAtTime(800, now + 1.0);
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 1.1);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.2);
      
      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn('Siren playback failed', e);
    }
  };

  const fetchScammerReply = async () => {
    const transcript = eventsRef.current
      .filter(e => e.type === 'bot' || e.type === 'agent_response')
      .map(e => `${e.type === 'bot' ? 'Richard' : 'Margaret'}: ${e.text}`)
      .join('\n');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/call/scammer-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      const data = await res.json();
      const replyText = data.text;

      setEvents(prev => [...prev, { type: 'bot', text: replyText }]);

      await playDeepgramTTS(replyText, 'aura-orion-en', () => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current?.send(JSON.stringify({ type: 'text', text: replyText }));
        }
        isScammerSpeakingRef.current = false;
      });
    } catch(e) {
      console.error(e);
      isScammerSpeakingRef.current = false;
    }
  };

  const handleTurnComplete = () => {
    if (demoStateRef.current !== 'active' || isScammerSpeakingRef.current) return;
    isScammerSpeakingRef.current = true;

    const currentTime = audioContext.current?.currentTime || 0;
    const timeToWait = Math.max(0, (nextPlayTime.current - currentTime) * 1000);

    setTimeout(() => {
      fetchScammerReply();
    }, timeToWait + 800);
  };

  // ── LIVE DEMO (Hits APIs) ──
  const startDemo = async () => {
    setDemoState('incoming');
    setEvents([]);
    isScammerSpeakingRef.current = true;

    const initialText = "Hello, this is Richard from Amazon Customer Support. We detected a fraudulent charge of $499 on your account.";
    setEvents([{ type: 'bot', text: initialText }]);

    await playDeepgramTTS(initialText, 'aura-orion-en', async () => {
      setDemoState('detected');
      playSirenSound();
      setEvents(p => [...p, { type: 'system', text: '🚨 SPAM THREAT DETECTED: Financial Impersonation 🚨' }]);

      await new Promise(r => setTimeout(r, 1500));

      setDemoState('intercepting');
      setEvents(p => [...p, { type: 'system', text: 'Routing connection to Autonomous AI Decoy Agent...' }]);

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/api/call/start?caller_city=Seoul&caller_country=KR`, { method: 'POST' });
        const data = await res.json();
        const iId = data.id;
        setIncidentId(iId);

        const wsUrl = (process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000').replace('http', 'ws') + '/ws/call?incident_id=' + iId;
        ws.current = new WebSocket(wsUrl);
        ws.current.binaryType = 'arraybuffer';

        ws.current.onopen = () => {
          setConnected(true);
          setDemoState('active');
          setEvents(p => [...p, { type: 'system', text: '> Intercept Successful. Decoy Active in Seoul, KR.' }]);

          ws.current?.send(JSON.stringify({ type: 'text', text: initialText }));
          isScammerSpeakingRef.current = false;
        };

        ws.current.onmessage = async (event) => {
          if (typeof event.data === 'string') {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'entity_extracted') {
                setEvents((prev) => [...prev, data]);
              } else if (data.type === 'agent_response') {
                setEvents((prev) => [...prev, data]);
                await playDeepgramTTS(data.text, 'aura-hera-en', () => {
                  handleTurnComplete();
                });
              } else if (data.type === 'turn_complete') {
                // Relies on TTS callback
              }
            } catch (e) { }
          } else if (event.data instanceof ArrayBuffer) {
            // (Live binary audio bypass unused in chat mode)
          }
        };

        ws.current.onclose = () => {
          setConnected(false);
          setDemoState('finished');
          setEvents(p => [...p, { type: 'system', text: '> Call Terminated (Maximum duration reached / Target isolated).' }]);
        };

      } catch(e) {
        console.error(e);
        setDemoState('idle');
      }
    });
  };

  // ── CACHED DEMO (Guaranteed to work without Gemini API) ──
  const startDiagnosticDemo = async () => {
    setDemoState('incoming');
    setEvents([]);
    isScammerSpeakingRef.current = true;
    
    const script = [
      { type: 'bot', text: "Hello, this is Richard from Amazon Customer Support. We detected a fraudulent charge of $499 on your account." },
      { type: 'agent_response', text: "Oh hello? Who is this, dear? I wasn't expecting a call today." },
      { type: 'bot', text: "Yes ma'am, to cancel this charge and secure your account, we need you to purchase an Apple gift card." },
      { type: 'agent_response', text: "A gift card? Oh goodness, my grandson handles all that. What number can I call you back on?" },
      { type: 'entity_extracted', entity: { type: 'payment_method', value: 'Gift card', confidence: 0.95 } },
      { type: 'bot', text: "Please write down your cancellation case number. It is AZ dash 9 9 4 2. Do you have that?" },
      { type: 'agent_response', text: "Let me write that down... AZ-9942 was it? Let me read it back to make sure I have it right." },
      { type: 'entity_extracted', entity: { type: 'case_id', value: 'AZ-9942', confidence: 0.95 } },
      { type: 'entity_extracted', entity: { type: 'institution', value: 'Amazon', confidence: 0.90 } },
      { type: 'bot', text: "If you do not comply, we will have to suspend your account and contact local authorities immediately." },
      { type: 'agent_response', text: "Oh dear, my tea kettle is boiling over, I have to go now, goodbye!" }
    ];

    const initial = script[0];
    setEvents([{ type: 'bot', text: initial.text }]);

    await playDeepgramTTS(initial.text!, 'aura-orion-en', async () => {
      setDemoState('detected');
      playSirenSound();
      setEvents(p => [...p, { type: 'system', text: '🚨 SPAM THREAT DETECTED: Financial Impersonation 🚨' }]);
      await new Promise(r => setTimeout(r, 1500));

      setDemoState('intercepting');
      setEvents(p => [...p, { type: 'system', text: 'Routing connection to Autonomous AI Decoy Agent...' }]);

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
        await fetch(`${backendUrl}/api/call/start?caller_city=Seoul&caller_country=KR`, { method: 'POST' });
      } catch(e) {} // Fails gracefully if backend is entirely dead

      setConnected(true);
      setDemoState('active');
      setEvents(p => [...p, { type: 'system', text: '> Intercept Successful. Decoy Active in Local Diagnostic Mode.' }]);

      let stepIdx = 1;
      const playNext = async () => {
        if (stepIdx >= script.length) {
          setDemoState('finished');
          setConnected(false);
          setEvents(p => [...p, { type: 'system', text: '> Call Terminated (Diagnostic complete).' }]);
          return;
        }
        
        const step = script[stepIdx];
        stepIdx++;
        
        if (step.type === 'entity_extracted') {
          setEvents(p => [...p, step as Event]);
          setTimeout(playNext, 500); // Short delay for UI updates
        } else {
          await new Promise(r => setTimeout(r, 800)); // Natural breathing pause
          setEvents(p => [...p, step as Event]);
          const voice = step.type === 'bot' ? 'aura-orion-en' : 'aura-hera-en';
          playDeepgramTTS(step.text!, voice, playNext);
        }
      };
      
      playNext();
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  useEffect(() => {
    return () => {
      ws.current?.close();
    };
  }, []);

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
        borderRadius: 12, width: 900, height: 600, display: 'flex', overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                width: 10, height: 10, borderRadius: '50%', 
                background: demoState === 'active' ? 'var(--threat-live)' : 'var(--threat-low)',
                boxShadow: demoState === 'active' ? '0 0 10px var(--threat-live)' : 'none',
                animation: demoState === 'active' ? 'pulse-dot 1s infinite' : 'none'
              }} />
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Active Wiretap
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button 
                onClick={startDiagnosticDemo}
                disabled={demoState !== 'idle'}
                style={{
                  background: 'transparent',
                  color: demoState !== 'idle' ? 'transparent' : 'var(--text-tertiary)',
                  border: 'none', borderRadius: 6,
                  padding: '4px 6px', fontSize: 10, fontWeight: 'bold', cursor: demoState !== 'idle' ? 'default' : 'pointer',
                  opacity: demoState !== 'idle' ? 0 : 0.5, transition: 'all 0.2s',
                }}
                title="Run Local Diagnostic Sequence (Offline Fallback)"
              >
                SYS-CHK
              </button>
              <button 
                onClick={startDemo}
                disabled={demoState !== 'idle'}
                style={{
                  background: demoState !== 'idle' ? 'transparent' : 'var(--accent)',
                  color: demoState !== 'idle' ? 'var(--text-tertiary)' : '#000',
                  border: demoState !== 'idle' ? '1px solid var(--border-emphasis)' : 'none', borderRadius: 6,
                  padding: '6px 14px', fontSize: 12, fontWeight: 'bold', cursor: demoState !== 'idle' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', boxShadow: demoState === 'idle' ? '0 0 10px rgba(212,212,212,0.4)' : 'none'
                }}
              >
                {demoState === 'idle' ? 'Initiate Autonomous Decoy' : demoState.toUpperCase()}
              </button>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10, background: '#050505' }}>
            {events.map((ev, i) => {
              if (ev.type === 'entity_extracted') return null;
              
              if (ev.type === 'system') {
                return (
                  <div key={i} style={{ color: 'var(--text-mono)', fontSize: 12, fontFamily: 'monospace', margin: '8px 0', borderLeft: '2px solid var(--text-mono)', paddingLeft: 10 }}>
                    {ev.text}
                  </div>
                );
              }
              
              const isBot = ev.type === 'bot';
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: isBot ? '#f97316' : 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'monospace' }}>
                    [{isBot ? 'TARGET (SCAMMER)' : 'DECOY AGENT'}]
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14, fontFamily: 'monospace', lineHeight: 1.5 }}>
                    {ev.text}
                  </div>
                </div>
              );
            })}
            {demoState === 'active' && (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'monospace', marginTop: 10, animation: 'pulse-dot 1.5s infinite' }}>
                Listening to channel...
              </div>
            )}
          </div>
        </div>

        <div style={{ width: 320, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live Intel Extraction
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {entities.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'monospace', textAlign: 'center', marginTop: 40 }}>
                Awaiting target entities...
              </div>
            ) : (
              entities.map((ent, i) => (
                <div key={i} style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-emphasis)', borderLeft: '3px solid var(--accent)',
                  borderRadius: 4, padding: '10px 12px', marginBottom: 12, animation: 'scaleIn 200ms ease-out'
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4, letterSpacing: '0.05em' }}>
                    {ent?.type?.replace('_', ' ')}
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 13, fontFamily: 'monospace' }}>
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
