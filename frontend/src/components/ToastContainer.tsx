import React from 'react';
import { Bell, AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '360px',
      }}
    >
      {toasts.map((toast) => {
        let bg = 'var(--bg-card)';
        let border = 'var(--border-color)';
        let iconColor = 'var(--accent-amber)';
        let Icon = Info;

        if (toast.type === 'success') {
          bg = 'rgba(16, 185, 129, 0.95)';
          border = '#10B981';
          iconColor = '#fff';
          Icon = CheckCircle;
        } else if (toast.type === 'warning' || toast.type === 'alert') {
          bg = 'rgba(239, 68, 68, 0.95)';
          border = '#EF4444';
          iconColor = '#fff';
          Icon = AlertCircle;
        } else {
          bg = 'rgba(19, 23, 34, 0.95)';
          border = 'var(--accent-amber)';
          iconColor = 'var(--accent-amber)';
          Icon = Bell;
        }

        return (
          <div
            key={toast.id}
            style={{
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: '12px',
              padding: '14px',
              color: '#fff',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <Icon size={20} color={iconColor} style={{ marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>{toast.title}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{toast.message}</div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7 }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
