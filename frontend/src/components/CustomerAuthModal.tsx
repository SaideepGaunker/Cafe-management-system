import React, { useState } from 'react';
import { X, LogIn, UserPlus, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.post('/auth/register', { name, email, password, role: 'CUSTOMER' });
        localStorage.setItem('cafe_auth_token', res.token);
        localStorage.setItem('cafe_user', JSON.stringify(res.user));
        onSuccess(res.user, res.token);
      } else {
        const res = await api.post('/auth/login', { email, password });
        if (res.user.role !== 'CUSTOMER') {
          setError('Staff and Admin accounts must log in via the Employee Portal (/staff-portal)');
          setLoading(false);
          return;
        }
        localStorage.setItem('cafe_auth_token', res.token);
        localStorage.setItem('cafe_user', JSON.stringify(res.user));
        onSuccess(res.user, res.token);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const quickCustomerLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: 'customer@cafe.com', password: 'customer123' });
      localStorage.setItem('cafe_auth_token', res.token);
      localStorage.setItem('cafe_user', JSON.stringify(res.user));
      onSuccess(res.user, res.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isRegister ? 'Customer Registration' : 'Customer Sign In'}</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert-banner" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Customer Login */}
        <div style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>⚡ Instant Customer Login:</span>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 14px' }} onClick={quickCustomerLogin}>
            👤 Customer Demo
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sophia Reed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="customer@cafe.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            <span>{loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In as Customer'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isRegister ? 'Already have a customer account?' : 'New customer?'}{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-amber)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
