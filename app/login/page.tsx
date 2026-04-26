'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      login(data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000000', 
      color: '#ffffff', 
      fontFamily: '"Courier New", Courier, monospace',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
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

      <div style={{ 
        width: '400px', 
        border: '1px solid #333', 
        padding: '40px', 
        backgroundColor: '#000',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'left', marginBottom: '30px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            [SCAMSHIELD_AUTH]
          </div>
          <p style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Provide credentials for access
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              &gt; IDENTIFIER
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ 
                width: '100%', 
                backgroundColor: 'transparent', 
                border: '1px solid #333', 
                padding: '12px', 
                color: '#fff', 
                outline: 'none', 
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '14px' 
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              &gt; PASSPHRASE
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ 
                width: '100%', 
                backgroundColor: 'transparent', 
                border: '1px solid #333', 
                padding: '12px', 
                color: '#fff', 
                outline: 'none', 
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '14px' 
              }}
            />
          </div>

          {error && <div style={{ fontSize: '12px', color: '#ff0000', marginTop: '10px' }}>[ERROR] {error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              backgroundColor: '#fff', 
              color: '#000', 
              border: 'none', 
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '14px', 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
              cursor: loading ? 'wait' : 'pointer', 
              marginTop: '20px' 
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'EXECUTE'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#666' }}>
          NO CLEARANCE? <Link href="/register" style={{ color: '#fff', textDecoration: 'underline' }}>REQUEST ACCESS</Link>
        </div>
        
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#666', fontSize: '12px', textDecoration: 'none' }}>
            &lt; RETURN_TO_ROOT
          </Link>
        </div>
      </div>
    </div>
  );
}
