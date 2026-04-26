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
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [recording, setRecording] = useState(false);
  const [botMode, setBotMode] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Audio playback and recording refs
  const audioContext = useRef<AudioContext | null>(null);
  const nextPlayTime = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Bot logic
  const botInterval = useRef<NodeJS.Timeout | null>(null);
  const botScript = [
    "Hello, this is Richard from Amazon Customer Support. We detected a fraudulent charge of $499 on your account.",
    "No ma'am, this is an urgent matter. You need to buy an Amazon Gift card to verify your identity.",
    "Your case number is AZ-9942. Please go to the store immediately.",
    "If you do not comply, we will have to suspend your account and contact local authorities."
  ];
  const botStep = useRef(0);

  useEffect(() => {
    const wsUrl = (process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000').replace('http', 'ws') + '/ws/call';
    ws.current = new WebSocket(wsUrl);
    ws.current.binaryType = 'arraybuffer';

    ws.current.onopen = () => {
      setConnected(true);
      setEvents([{ type: 'system', text: 'System: Call connected to Gemini Live Audio Agent. Click the Mic to speak, or enable Auto-Scammer.' }]);
    };

    ws.current.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'agent_response' || data.type === 'entity_extracted') {
            setEvents((prev) => [...prev, data]);
          }
        } catch (e) {
          console.error('Error parsing WS JSON message', e);
        }
      } else if (event.data instanceof ArrayBuffer) {
        if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const audioData = new Int16Array(event.data);
        const floatData = new Float32Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          floatData[i] = audioData[i] / 32768.0;
        }

        const buffer = audioContext.current.createBuffer(1, floatData.length, 24000);
        buffer.copyToChannel(floatData, 0);

        const source = audioContext.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.current.destination);

        const currentTime = audioContext.current.currentTime;
        const playTime = Math.max(currentTime, nextPlayTime.current);
        source.start(playTime);
        nextPlayTime.current = playTime + buffer.duration;
      }
    };

    ws.current.onclose = () => {
      setConnected(false);
      setEvents((prev) => [...prev, { type: 'system', text: 'System: Call disconnected.' }]);
      stopRecording();
      if (botInterval.current) clearInterval(botInterval.current);
    };

    return () => {
      ws.current?.close();
      stopRecording();
      if (botInterval.current) clearInterval(botInterval.current);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);
  
  // Bot Auto-Scammer Logic
  useEffect(() => {
    if (botMode && connected) {
      botInterval.current = setInterval(() => {
        if (botStep.current < botScript.length) {
          const msg = botScript[botStep.current];
          setEvents((prev) => [...prev, { type: 'bot', text: msg }]);
          ws.current?.send(JSON.stringify({ type: 'text', text: msg }));
          
          // Browser TTS for the bot
          const utterance = new SpeechSynthesisUtterance(msg);
          utterance.rate = 0.95;
          utterance.pitch = 0.8;
          window.speechSynthesis.speak(utterance);
          
          botStep.current += 1;
        } else {
          if (botInterval.current) clearInterval(botInterval.current);
          setBotMode(false);
        }
      }, 8000); // Wait 8 seconds between bot messages to allow Decoy to reply
    } else {
      if (botInterval.current) clearInterval(botInterval.current);
    }
    return () => { if (botInterval.current) clearInterval(botInterval.current); };
  }, [botMode, connected]);

  const startRecording = async () => {
    if (botMode) setBotMode(false); // Disable bot if manual recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
        const float32Array = e.inputBuffer.getChannelData(0);
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
          int16Array[i] = Math.max(-32768, Math.min(32767, float32Array[i] * 32768));
        }
        ws.current.send(int16Array.buffer);
      };

      source.connect(processor);
      processor.connect(context.destination);
      setRecording(true);
      
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      } else if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
    } catch (err) {
      console.error('Failed to get user media', err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setRecording(false);
    
    if (ws.current?.readyState === WebSocket.OPEN) {
       ws.current.send(JSON.stringify({ type: 'end_of_turn' }));
    }
  };

  const toggleRecording = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !connected) return;

    setEvents((prev) => [...prev, { type: 'user', text: input }]);
    ws.current?.send(JSON.stringify({ type: 'text', text: input }));
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
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Live Audio Intercept</span>
            </div>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button 
                onClick={() => {
                  botStep.current = 0;
                  setBotMode(!botMode);
                  if (recording) stopRecording();
                }}
                disabled={!connected}
                style={{
                  background: botMode ? 'var(--threat-live)' : 'transparent',
                  color: botMode ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-emphasis)', borderRadius: 6,
                  padding: '4px 10px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {botMode ? 'Stop Auto-Scammer' : 'Run Auto-Scammer'}
              </button>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map((ev, i) => {
              if (ev.type === 'entity_extracted') return null;
              if (ev.type === 'system') return (
                <div key={i} style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12, fontStyle: 'italic', margin: '10px 0' }}>{ev.text}</div>
              );
              
              const isUser = ev.type === 'user' || ev.type === 'bot';
              return (
                <div key={i} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, textAlign: isUser ? 'right' : 'left' }}>
                    {isUser ? (ev.type === 'bot' ? 'Auto-Scammer Bot' : 'You (Scammer)') : 'Decoy Agent'}
                  </div>
                  <div style={{
                    background: isUser ? (ev.type === 'bot' ? '#f97316' : 'var(--accent)') : 'var(--bg-tertiary)',
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

          <form onSubmit={handleSendText} style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <button 
              type="button"
              onClick={toggleRecording} 
              disabled={!connected || botMode} 
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: recording ? 'var(--threat-live)' : 'var(--bg-tertiary)', 
                color: recording ? '#ffffff' : 'var(--text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (connected && !botMode) ? 'pointer' : 'not-allowed', opacity: (connected && !botMode) ? 1 : 0.5,
                boxShadow: recording ? '0 0 15px var(--threat-live)' : 'none',
                transition: 'all 0.2s ease-in-out'
              }}
              title={recording ? "Click to Stop Speaking" : "Click to Speak"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Or type here..."
              disabled={!connected || botMode}
              style={{
                flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', padding: '10px 14px', borderRadius: 6, outline: 'none',
                opacity: botMode ? 0.5 : 1
              }}
            />
            <button type="submit" disabled={!connected || botMode} style={{
              background: 'var(--accent)', color: '#000000', border: 'none', borderRadius: 6,
              padding: '0 20px', fontWeight: 600, cursor: (connected && !botMode) ? 'pointer' : 'not-allowed', opacity: (connected && !botMode) ? 1 : 0.5,
              height: 40
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
