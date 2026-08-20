import React, { useState } from 'react';
import { ShoppingCart, Zap, CreditCard, Banknote, Store } from 'lucide-react';
import type { MenuItem, Order } from '../types';
import { api } from '../services/api';

interface OfflineCounterPosProps {
  menuItems: MenuItem[];
  onOrderPlaced: (order: Order, options?: { skipTracker?: boolean }) => void;
  onRefreshData: () => void;
  isOnline?: boolean;
  offlineQueueLength?: number;
}

export const OfflineCounterPos: React.FC<OfflineCounterPosProps> = ({
  menuItems,
  onOrderPlaced,
  onRefreshData,
}) => {
  const [posCart, setPosCart] = useState<{ menuItem: MenuItem; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [saleSuccessMsg, setSaleSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToPosCart = (item: MenuItem) => {
    setPosCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updatePosQty = (menuItemId: string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((ci) => {
          if (ci.menuItem.id === menuItemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as { menuItem: MenuItem; quantity: number }[]
    );
  };

  const totalAmount = posCart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  const handleCompletePosSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const payload = {
      customerName: customerName || 'Walk-in Customer',
      tableNumber: `POS Counter (${paymentMethod})`,
      orderType: 'TAKEAWAY',
      items: posCart.map((ci) => ({
        menuItemId: ci.menuItem.id,
        quantity: ci.quantity,
      })),
    };

    try {
      const res = await api.post('/orders', payload);
      if (res && res.order) {
        onOrderPlaced(res.order, { skipTracker: true });
        setPosCart([]);
        setCustomerName('Walk-in Customer');
        setSaleSuccessMsg('⚡ Counter Sale Completed Successfully!');
        setTimeout(() => setSaleSuccessMsg(null), 4000);
        onRefreshData();
      }
    } catch (err: any) {
      console.error('POS Sale Error:', err);
      alert(err?.message || 'Failed to complete counter sale. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Clean Counter POS Header Banner */}
      <div className="hero-banner" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(19, 23, 34, 0.95) 100%)', border: '1px solid var(--accent-amber)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Store size={36} color="var(--accent-amber)" />
          <div>
            <h1 className="hero-title" style={{ fontSize: '2rem', marginBottom: '4px' }}>
              Counter POS Terminal
            </h1>
            <p className="hero-subtitle">
              Fast walk-in counter ordering & instant checkout. Sales directly update inventory stock, Kitchen KDS & Admin Analytics.
            </p>
          </div>
        </div>
      </div>

      {/* POS Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Item Selection Grid */}
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Select Items for Counter Sale</h2>
          <div className="menu-grid">
            {menuItems.map((item) => {
              const portions = item.availableStock ?? 0;
              const isOutOfStock = !item.isAvailable || portions === 0;

              return (
                <div
                  key={item.id}
                  className="menu-card"
                  style={{ cursor: isOutOfStock ? 'not-allowed' : 'pointer', opacity: isOutOfStock ? 0.6 : 1 }}
                  onClick={() => !isOutOfStock && addToPosCart(item)}
                >
                  <div className="menu-card-content" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="menu-card-title" style={{ fontSize: '1.05rem', margin: 0 }}>{item.name}</span>
                      <span className="menu-card-price" style={{ fontSize: '1.1rem' }}>${item.price.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{item.category}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`} style={{ position: 'static' }}>
                        {isOutOfStock ? 'Sold Out' : `${portions} in stock`}
                      </span>
                      <button
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                        disabled={isOutOfStock}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* POS Order Summary Sidebar */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', height: 'fit-content', position: 'sticky', top: '90px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <ShoppingCart size={20} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Counter Checkout</h3>
          </div>

          {saleSuccessMsg && (
            <div className="alert-banner" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10B981', marginBottom: '16px' }}>
              <span>{saleSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleCompletePosSale}>
            <div className="form-group">
              <label className="form-label">Customer / Table Note</label>
              <input
                type="text"
                className="form-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn-secondary ${paymentMethod === 'CASH' ? 'active' : ''}`}
                  style={{ background: paymentMethod === 'CASH' ? 'rgba(245, 158, 11, 0.2)' : undefined, borderColor: paymentMethod === 'CASH' ? 'var(--accent-amber)' : undefined, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => setPaymentMethod('CASH')}
                >
                  <Banknote size={16} />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  className={`btn-secondary ${paymentMethod === 'CARD' ? 'active' : ''}`}
                  style={{ background: paymentMethod === 'CARD' ? 'rgba(59, 130, 246, 0.2)' : undefined, borderColor: paymentMethod === 'CARD' ? '#3B82F6' : undefined, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => setPaymentMethod('CARD')}
                >
                  <CreditCard size={16} />
                  <span>Card POS</span>
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {posCart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No items selected yet. Click items on the left to add.
                </div>
              ) : (
                posCart.map((ci) => (
                  <div key={ci.menuItem.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{ci.menuItem.name}</div>
                      <div style={{ color: 'var(--accent-amber)', fontSize: '0.8rem' }}>${(ci.menuItem.price * ci.quantity).toFixed(2)}</div>
                    </div>
                    <div className="qty-control">
                      <button type="button" className="qty-btn" onClick={() => updatePosQty(ci.menuItem.id, -1)}>-</button>
                      <span className="qty-val">{ci.quantity}</span>
                      <button type="button" className="qty-btn" onClick={() => updatePosQty(ci.menuItem.id, 1)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0 16px', fontSize: '1.2rem', fontWeight: 800 }}>
              <span>Total Sale</span>
              <span style={{ color: 'var(--accent-amber)' }}>${totalAmount.toFixed(2)}</span>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={posCart.length === 0 || isSubmitting}>
              <Zap size={18} />
              <span>{isSubmitting ? 'Processing Sale...' : 'Complete Counter Sale'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
