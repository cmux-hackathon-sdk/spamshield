'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Authenticating Clearance...</div>;
  }

  return <>{children}</>;
}
