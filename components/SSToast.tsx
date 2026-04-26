'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Toast, ToastVariant } from '@/lib/types';

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 3200);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  const variants: Record<ToastVariant, { icon: string; color: string; border: string }> = {
    success: { icon: '✓', color: 'var(--text-mono)', border: 'rgba(16,185,129,0.3)' },
    warning: { icon: '⚠', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    danger:  { icon: '✕', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    default: { icon: 'ℹ', color: 'var(--accent)', border: 'rgba(30,144,255,0.3)' },
  };
  const v = variants[toast.variant] || variants.default;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--bg-tertiary)', border: `1px solid ${v.border}`, borderLeft: `3px solid ${v.color}`,
      borderRadius: 6, padding: '10px 16px', minWidth: 260, maxWidth: 360,
      pointerEvents: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      opacity: visible ? 1 : 0,
      transition: 'transform 280ms cubic-bezier(0.16,1,0.3,1), opacity 280ms ease',
    }}>
      <span style={{ color: v.color, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{v.icon}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}>×</button>
    </div>
  );
}

export function SSToast({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, variant: ToastVariant = 'default') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, message, variant }]);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);
  return { toasts, addToast, removeToast };
}
