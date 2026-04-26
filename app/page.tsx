'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const ASCII_ART = `
   _____                     _____ _     _      _     _ 
  / ____|                   / ____| |   (_)    | |   | |
 | (___   ___  __ _ _ __   | (___ | |__  _  ___| | __| |
  \\___ \\ / __|/ _\` | '_ \\   \\___ \\| '_ \\| |/ _ \\ |/ _\` |
  ____) | (__| (_| | | | |  ____) | | | | |  __/ | (_| |
 |_____/ \\___|\\__,_|_| |_| |_____/|_| |_|_|\\___|_|\\__,_|
`;

const CAPABILITIES = [
  {
    id: "01",
    title: "AUTONOMOUS INTERCEPTION",
    desc: "Deploys conversational AI decoys to engage fraudulent actors in real-time, effectively tarpitting operations and protecting vulnerable citizens from direct exposure."
  },
  {
    id: "02",
    title: "THREAT TELEMETRY",
    desc: "Extracts and cross-references critical vector data during live calls, including geolocation markers, spoofed routing numbers, and script heuristics."
  },
  {
    id: "03",
    title: "AGENCY SYNDICATION",
    desc: "Automatically compiles structured incident reports from unstructured voice data, establishing a continuous intelligence pipeline to federal and local law enforcement."
  },
  {
    id: "04",
    title: "ZERO-DAY DETECTION",
    desc: "Leverages deep semantic analysis to identify novel social engineering paradigms and behavioral anomalies before they scale into widespread campaigns."
  }
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000000', 
      color: '#ffffff', 
      fontFamily: '"Courier New", Courier, monospace',
      display: 'flex', 
      flexDirection: 'column', 
      overflowX: 'hidden',
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Noise overlay */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        opacity: 0.04,
        pointerEvents: 'none',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        zIndex: 50
      }} />

      {/* Header */}
      <header style={{ 
        padding: '30px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        borderBottom: '1px solid #222',
        flexShrink: 0
      }}>
        <div style={{ fontSize: '14px', letterSpacing: '0.05em' }}>
          [SCAMSHIELD_INTELLIGENCE_NODE]
          <br/>
          STATUS: <span style={{ color: '#00ff00' }}>ONLINE</span>
        </div>
        <Link href="/login" style={{ 
          color: '#fff', 
          textDecoration: 'none', 
          border: '1px solid #fff', 
          padding: '8px 16px',
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          Authenticate
        </Link>
      </header>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '80px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ 
          minHeight: '60vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <pre style={{ 
            fontSize: 'clamp(8px, 1vw, 16px)', 
            lineHeight: 1.2, 
            marginBottom: '40px',
            color: '#ffffff',
            textShadow: '0 0 10px rgba(255,255,255,0.3)'
          }}>
            {ASCII_ART}
          </pre>

          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
            <p style={{ 
              fontSize: '16px', 
              lineHeight: 1.6, 
              marginBottom: '40px',
              color: '#aaaaaa'
            }}>
              Real-time AI-powered monitoring of global scam networks. Deploys autonomous decoys to intercept fraud calls, extract actionable intelligence, and neutralize threats.
            </p>
            
            <Link href="/login" style={{ 
              display: 'inline-block',
              backgroundColor: '#ffffff', 
              color: '#000000', 
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: 'bold',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Initialize Link
            </Link>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '40px', 
            marginTop: '80px',
            padding: '20px',
            borderTop: '1px solid #222',
            borderBottom: '1px solid #222',
            width: '100%',
            maxWidth: '800px',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>250</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>FTC INCIDENTS</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>1.2s</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>INTERCEPT LATENCY</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>12</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>PARTNER AGENCIES</div>
            </div>
          </div>
        </div>

        {/* Capabilities Section */}
        <div style={{ 
          marginTop: '120px', 
          width: '100%', 
          maxWidth: '1000px',
          marginBottom: '80px'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '40px',
            letterSpacing: '0.1em',
            borderBottom: '1px solid #333',
            paddingBottom: '10px',
            display: 'inline-block'
          }}>
            // SYSTEM_CAPABILITIES
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '40px' 
          }}>
            {CAPABILITIES.map((cap) => (
              <div key={cap.id} style={{ 
                border: '1px solid #222', 
                padding: '30px',
                position: 'relative',
                backgroundColor: 'rgba(20,20,20,0.5)'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-12px', 
                  left: '20px', 
                  backgroundColor: '#000', 
                  padding: '0 10px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  [{cap.id}]
                </div>
                <h3 style={{ 
                  fontSize: '16px', 
                  marginBottom: '16px', 
                  color: '#fff',
                  letterSpacing: '0.05em' 
                }}>
                  &gt; {cap.title}
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  lineHeight: 1.6, 
                  color: '#888' 
                }}>
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        padding: '20px 40px', 
        borderTop: '1px solid #222', 
        display: 'flex', 
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#666',
        flexShrink: 0
      }}>
        <div>(C) 2026 SCAMSHIELD // CLASSIFIED</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#ffffff' }} />
          SYSTEM_NOMINAL
        </div>
      </footer>
    </div>
  );
}


