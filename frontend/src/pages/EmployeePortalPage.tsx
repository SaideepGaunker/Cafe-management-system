import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

interface EmployeePortalPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const EmployeePortalPage: React.FC<EmployeePortalPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.user.role === 'CUSTOMER') {
        setError('Access Denied: Customer accounts are not authorized to access the Employee & Staff Portal.');
        setLoading(false);
        return;
      }

      localStorage.setItem('cafe_auth_token', res.token);
      localStorage.setItem('cafe_user', JSON.stringify(res.user));
      onLoginSuccess(res.user, res.token);

      if (res.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/kitchen');
      }
    } catch (err: any) {
      setError(err.message || 'Employee authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const quickEmployeeLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: demoEmail, password: demoPass });
      localStorage.setItem('cafe_auth_token', res.token);
      localStorage.setItem('cafe_user', JSON.stringify(res.user));
      onLoginSuccess(res.user, res.token);

      if (res.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/kitchen');
      }
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'radial-gradient(circle at top, #1a202c 0%, #0b0d12 100%)' }}>
      <div className="modal-box" style={{ maxWidth: '460px', border: '1px solid var(--border-glow)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-gold))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#000', marginBottom: '12px', boxShadow: 'var(--shadow-glow)' }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Employee & Staff Portal</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Authorized Barista Staff & Cafe Management Access Only
          </p>
        </div>

        {error && (
          <div className="alert-banner" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Employee Demo Presets */}
        <div style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>
            ⚡ Fast Employee Logins:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px' }}
              onClick={() => quickEmployeeLogin('staff@cafe.com', 'staff123')}
            >
              ☕ Barista Staff
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px' }}
              onClick={() => quickEmployeeLogin('admin@cafe.com', 'admin123')}
            >
              👑 Cafe Manager
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Employee Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="staff@cafe.com or admin@cafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
            <Lock size={18} />
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            ← Return to Customer Cafe Storefront
          </button>
        </div>
      </div>
    </div>
  );
};
