import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Coffee, ShoppingBag, User as UserIcon, Shield, Utensils, Wifi, WifiOff, LogOut, HardDrive, RefreshCw } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  mode: 'ONLINE' | 'OFFLINE';
  onToggleMode: () => void;
  currentUser: User | null;
  onOpenCustomerAuth: () => void;
  onOpenProfile?: () => void;
  onLogout: () => void;
  cartCount: number;
  onOpenCart: () => void;
  isOnline: boolean;
  offlineQueueLength: number;
  onSyncOffline: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  onToggleMode,
  currentUser,
  onOpenCustomerAuth,
  onOpenProfile,
  onLogout,
  cartCount,
  onOpenCart,
  isOnline,
  offlineQueueLength,
  onSyncOffline,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isStaffPage = location.pathname.startsWith('/kitchen');
  const isAdminPage = location.pathname.startsWith('/admin');
  const isOfflinePosPage = location.pathname.startsWith('/offline-pos');

  return (
    <header className="navbar">
      <div
        className="nav-brand"
        style={{ cursor: 'pointer' }}
        onClick={() => {
          if (currentUser?.role === 'ADMIN') navigate('/admin');
          else if (currentUser?.role === 'STAFF') navigate('/kitchen');
          else navigate('/');
        }}
      >
        <div className="brand-icon">
          <Coffee size={24} />
        </div>
        <span>BiiZnest</span>
      </div>

      {/* Navigation Tabs (Staff & Admin Portal Controls) */}
      <nav className="nav-tabs">
        {currentUser && currentUser.role === 'STAFF' && (
          <button
            className={`nav-tab ${isStaffPage ? 'active' : ''}`}
            onClick={() => navigate('/kitchen')}
          >
            <Utensils size={16} />
            <span>Kitchen Display</span>
          </button>
        )}

        {currentUser && currentUser.role === 'STAFF' && (
          <button
            className={`nav-tab ${isOfflinePosPage ? 'active' : ''}`}
            onClick={() => {
              if (mode === 'ONLINE') onToggleMode();
              navigate('/offline-pos');
            }}
          >
            <HardDrive size={16} color="#F59E0B" />
            <span>Counter POS</span>
          </button>
        )}

        {currentUser && currentUser.role === 'ADMIN' && (
          <button
            className={`nav-tab ${isAdminPage ? 'active' : ''}`}
            onClick={() => navigate('/admin')}
          >
            <Shield size={16} />
            <span>Admin Portal</span>
          </button>
        )}
      </nav>

      <div className="nav-actions">
        {/* Offline Queue Sync Indicator */}
        {offlineQueueLength > 0 && (
          <button
            onClick={onSyncOffline}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: '#000',
              background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-gold))',
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Click to sync offline transactions with backend"
          >
            <RefreshCw size={14} />
            <span>Sync ({offlineQueueLength} Offline)</span>
          </button>
        )}

        {/* Network status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: isOnline ? '#10B981' : '#F59E0B',
            background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            padding: '4px 10px',
            borderRadius: '999px',
            border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          }}
        >
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isOnline ? 'Live Network' : 'Disconnected'}</span>
        </div>

        {/* Online Cart button (Only for Customers & Guests in Online Storefront) */}
        {(!currentUser || currentUser.role === 'CUSTOMER') && !isOfflinePosPage && (
          <button className="cart-btn" onClick={onOpenCart}>
            <ShoppingBag size={18} />
            <span>Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        )}

        {/* User Account / Auth Trigger */}
        {currentUser ? (
          <div className="user-pill">
            <button
              onClick={onOpenProfile}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
              title="Open Profile & Saved Addresses"
            >
              <UserIcon size={16} />
              <span>{currentUser.name.split(' ')[0]}</span>
            </button>
            <span className={`role-badge ${currentUser.role.toLowerCase()}`}>{currentUser.role}</span>
            <button
              onClick={onLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#EF4444',
                cursor: 'pointer',
                fontSize: '0.8rem',
                marginLeft: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
              title="Log out"
            >
              <LogOut size={12} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <button className="btn-login" onClick={onOpenCustomerAuth}>
            Customer Sign In
          </button>
        )}
      </div>
    </header>
  );
};
