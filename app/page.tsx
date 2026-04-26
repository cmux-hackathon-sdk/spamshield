'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', color: 'var(--text-primary)', overflow: 'hidden', position: 'relative' }}>
      {/* Background Gradients */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(30,144,255,0.05) 0%, transparent 70%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(220,38,38,0.05) 0%, transparent 70%)', zIndex: 0 }} />
      
      {/* Grid Pattern Overlay */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.03, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
        backgroundSize: '40px 40px' 
      }} />

      {/* Header */}
      <header style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 12, height: 12, background: 'var(--accent)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent)' }} />
          SCAMSHIELD
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/login" style={{ padding: '8px 20px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-emphasis)', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}>
            Agent Login
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 800 }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(30,144,255,0.1)', border: '1px solid rgba(30,144,255,0.2)', borderRadius: 20, color: 'var(--accent)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>
            Global Threat Intelligence Network
          </div>
          <h1 style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.03em' }}>
            Detect. Intercept.<br/>
            <span style={{ color: 'var(--accent)' }}>Neutralize.</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px auto' }}>
            Real-time AI-powered monitoring of global scam networks. Deploys autonomous decoys to intercept fraud calls, extract actionable intelligence, and feed data to law enforcement agencies worldwide.
          </p>
          
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/login" style={{ padding: '14px 32px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 0 20px rgba(212, 212, 212, 0.2)' }}>
              Access Secure Portal
            </Link>
          </div>
        </div>

        {/* Stats Preview */}
        <div style={{ display: 'flex', gap: 40, marginTop: 80, padding: '30px 60px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>2.4M+</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Calls Intercepted</div>
          </div>
          <div style={{ width: 1, background: 'var(--border-subtle)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--threat-live)', fontFamily: 'monospace' }}>14.2s</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Avg Detection Time</div>
          </div>
          <div style={{ width: 1, background: 'var(--border-subtle)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-mono)', fontFamily: 'monospace' }}>120+</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Partner Agencies</div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer style={{ padding: '20px 40px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>© 2026 ScamShield Intelligence. Classified.</div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>SYSTEM STATUS: ONLINE</div>
      </footer>
    </div>
  );
}
