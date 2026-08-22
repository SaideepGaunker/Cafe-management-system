import React, { useEffect, useState } from 'react';
import { X, Clock, Flame, CheckCircle2, Coffee, Check, AlertCircle } from 'lucide-react';
import { Order } from '../types';
import { socket, joinOrderTrackingRoom } from '../services/socket';
import { api } from '../services/api';

interface OrderTrackerModalProps {
  orderId: string | null;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    // Fetch latest order details
    setLoading(true);
    api.get(`/orders/public/${orderId}`)
      .then((res) => {
        setOrder(res.order);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load tracked order:', err);
        setLoading(false);
      });

    // Join real-time room for live status changes
    joinOrderTrackingRoom(orderId);

    const handleStatusUpdate = (updatedOrder: Order) => {
      if (updatedOrder.id === orderId) {
        setOrder(updatedOrder);
      }
    };

    const handleDataUpdated = () => {
      api.get(`/orders/public/${orderId}`)
        .then((res) => {
          if (res.order) setOrder(res.order);
        })
        .catch(() => {});
    };

    socket.on('orderStatusUpdated', handleStatusUpdate);
    socket.on('dataUpdated', handleDataUpdated);

    return () => {
      socket.off('orderStatusUpdated', handleStatusUpdate);
      socket.off('dataUpdated', handleDataUpdated);
    };
  }, [orderId]);

  if (!orderId) return null;

  const isDelivery = order?.orderType === 'DELIVERY';

  const steps = isDelivery
    ? [
        { key: 'PENDING', label: 'Order Received', icon: Clock, desc: 'Sent to kitchen' },
        { key: 'IN_PROGRESS', label: 'Preparing Order', icon: Flame, desc: 'Barista & kitchen preparing' },
        { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery 🚚', icon: Coffee, desc: 'Courier on the way to your address' },
        { key: 'COMPLETED', label: 'Delivered', icon: CheckCircle2, desc: 'Order delivered to your door' },
      ]
    : [
        { key: 'PENDING', label: 'Order Received', icon: Clock, desc: 'Sent to kitchen' },
        { key: 'IN_PROGRESS', label: 'Preparing Order', icon: Flame, desc: 'Crafting your coffee' },
        { key: 'READY', label: 'Ready for Pickup', icon: Coffee, desc: 'Fresh & ready at counter!' },
        { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2, desc: 'Order completed' },
      ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'IN_PROGRESS': return 1;
      case 'READY':
      case 'OUT_FOR_DELIVERY': return 2;
      case 'COMPLETED': return 3;
      default: return 0;
    }
  };

  const currentIndex = order ? getStepIndex(order.status) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Live Order Tracker</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Order ID: <span style={{ color: 'var(--accent-amber)', fontFamily: 'monospace' }}>#{orderId.slice(0, 8)}</span>
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading order status...</div>
        ) : !order ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#EF4444' }}>
            <AlertCircle size={32} />
            <p>Order not found</p>
          </div>
        ) : (
          <div>
            {/* Order Details Header */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{order.customerName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: 600, marginTop: '2px' }}>
                    {order.orderType === 'DELIVERY' ? '🚚 Express Home Delivery' : order.orderType === 'PICKUP' ? '🛍️ Store Pickup' : order.orderType === 'DINE_IN' ? `☕ Dine-In (${order.tableNumber})` : 'Takeaway Counter'}
                  </div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                  ${order.totalAmount.toFixed(2)}
                </div>
              </div>

              {order.phone && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  📞 Phone: <span style={{ color: 'var(--text-primary)' }}>{order.phone}</span>
                </div>
              )}

              {order.deliveryAddress && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  📍 Address: <span style={{ color: 'var(--text-primary)' }}>{order.deliveryAddress}</span>
                </div>
              )}

              {order.deliveryNotes && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                  📝 Notes: "{order.deliveryNotes}"
                </div>
              )}
            </div>

            {/* Stepper Visual */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', margin: '20px 0' }}>
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx < currentIndex;
                const isCurrent = idx === currentIndex;

                let iconBg = 'rgba(255, 255, 255, 0.08)';
                let iconColor = 'var(--text-muted)';
                let borderColor = 'var(--border-color)';

                if (isDone || isCurrent) {
                  if (step.key === 'PENDING') { iconBg = 'rgba(245, 158, 11, 0.2)'; iconColor = '#F59E0B'; borderColor = '#F59E0B'; }
                  if (step.key === 'IN_PROGRESS') { iconBg = 'rgba(59, 130, 246, 0.2)'; iconColor = '#3B82F6'; borderColor = '#3B82F6'; }
                  if (step.key === 'READY') { iconBg = 'rgba(16, 185, 129, 0.2)'; iconColor = '#10B981'; borderColor = '#10B981'; }
                  if (step.key === 'COMPLETED') { iconBg = 'rgba(107, 114, 128, 0.2)'; iconColor = '#9CA3AF'; borderColor = '#9CA3AF'; }
                }

                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: iconBg,
                        border: `2px solid ${borderColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: iconColor,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isDone ? <Check size={20} /> : <Icon size={20} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {step.label}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{step.desc}</div>
                    </div>

                    {isCurrent && (
                      <span className={`status-badge ${order.status}`}>
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Item Breakdown */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>Ordered Items:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>{item.quantity}x {item.menuItem.name}</span>
                    <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
