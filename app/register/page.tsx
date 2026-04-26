'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
      
      const res = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Registration failed');
      }

      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
      <div style={{ width: 400, background: 'var(--bg-secondary)', border: '1px solid var(--border-emphasis)', borderRadius: 12, padding: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, background: 'var(--accent)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent)' }} />
            SCAMSHIELD
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Request Access</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Register for Secure Network Clearance</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '12px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '12px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: 14 }}
            />
          </div>

          {error && <div style={{ fontSize: 13, color: 'var(--threat-live)', background: 'rgba(220,38,38,0.1)', padding: 10, borderRadius: 6, border: '1px solid rgba(220,38,38,0.2)' }}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: 14, background: 'var(--text-mono)', color: '#000', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', marginTop: 10 }}
          >
            {loading ? 'Processing...' : 'Register Clearance'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-tertiary)' }}>
          Already have clearance? <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Agent Login</Link>
        </div>
      </div>
    </div>
  );
}
