import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, CheckCircle2, AlertTriangle, RefreshCw, HardDrive, PlusCircle } from 'lucide-react';
import type { Order, OrderStatus, Ingredient } from '../types';
import { api } from '../services/api';

interface StaffDashboardProps {
  orders: Order[];
  ingredients: Ingredient[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onRefreshData: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  orders,
  ingredients,
  onUpdateOrderStatus,
  onRefreshData,
}) => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
  const [restockIngredient, setRestockIngredient] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [loadingRestock, setLoadingRestock] = useState(false);

  const activeOrders = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const displayedOrders = orders.filter((o) => {
    if (filterStatus === 'ACTIVE') return o.status !== 'COMPLETED' && o.status !== 'CANCELLED';
    if (filterStatus === 'ALL') return true;
    return o.status === filterStatus;
  });

  const lowStockIngredients = ingredients.filter((ing) => ing.currentStock <= ing.reorderThreshold);

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockIngredient || !restockQty) return;

    setLoadingRestock(true);
    try {
      await api.post('/inventory/restock', {
        ingredientId: restockIngredient.id,
        quantityChange: parseFloat(restockQty),
        type: 'RESTOCK',
        reason: 'Staff Kitchen Restock',
      });
      setRestockIngredient(null);
      setRestockQty('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Restock failed');
    } finally {
      setLoadingRestock(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Kitchen Display System (KDS)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Real-time preparation queue & active ingredient stock monitor.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={() => navigate('/offline-pos')} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}>
            <HardDrive size={16} />
            <span>Counter POS</span>
          </button>
          <button className="btn-secondary" onClick={onRefreshData} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockIngredients.length > 0 && (
        <div className="alert-banner" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#FCA5A5' }}>
          <AlertTriangle size={20} color="#EF4444" />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, color: '#EF4444' }}>Low Stock Alert: </span>
            {lowStockIngredients.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}
          </div>
        </div>
      )}

      {/* Status Filter Pills */}
      <div className="category-bar">
        <button className={`category-btn ${filterStatus === 'ACTIVE' ? 'active' : ''}`} onClick={() => setFilterStatus('ACTIVE')}>
          🔥 Active Queue ({activeOrders.length})
        </button>
        <button className={`category-btn ${filterStatus === 'PENDING' ? 'active' : ''}`} onClick={() => setFilterStatus('PENDING')}>
          ⏳ Pending ({orders.filter((o) => o.status === 'PENDING').length})
        </button>
        <button className={`category-btn ${filterStatus === 'IN_PROGRESS' ? 'active' : ''}`} onClick={() => setFilterStatus('IN_PROGRESS')}>
          👨‍🍳 Preparing ({orders.filter((o) => o.status === 'IN_PROGRESS').length})
        </button>
        <button className={`category-btn ${filterStatus === 'READY' ? 'active' : ''}`} onClick={() => setFilterStatus('READY')}>
          ✅ Ready ({orders.filter((o) => o.status === 'READY').length})
        </button>
        <button className={`category-btn ${filterStatus === 'OUT_FOR_DELIVERY' ? 'active' : ''}`} onClick={() => setFilterStatus('OUT_FOR_DELIVERY')}>
          🚚 Out for Delivery ({orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length})
        </button>
        <button className={`category-btn ${filterStatus === 'COMPLETED' ? 'active' : ''}`} onClick={() => setFilterStatus('COMPLETED')}>
          🏁 Completed ({orders.filter((o) => o.status === 'COMPLETED').length})
        </button>
        <button className={`category-btn ${filterStatus === 'ALL' ? 'active' : ''}`} onClick={() => setFilterStatus('ALL')}>
          All Orders ({orders.length})
        </button>
      </div>

      {/* Order Queue Grid */}
      <div className="kds-grid" style={{ marginBottom: '40px' }}>
        {displayedOrders.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <CheckCircle2 size={42} color="var(--accent-amber)" style={{ opacity: 0.5, marginBottom: '10px' }} />
            <h3>No orders in this queue</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Incoming orders will appear automatically in real-time.</p>
          </div>
        ) : (
          displayedOrders.map((order) => (
            <div key={order.id} className={`order-card status-${order.status}`}>
              <div className="order-header">
                <div>
                  <div className="order-id">Order #{order.id.slice(0, 8)}</div>
                  <div className="order-table" style={{ fontWeight: 700 }}>
                    {order.customerName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', marginTop: '2px', fontWeight: 600 }}>
                    {order.orderType === 'DELIVERY'
                      ? '🚚 Home Delivery'
                      : order.orderType === 'PICKUP'
                      ? '🛍️ Store Pickup'
                      : order.orderType === 'DINE_IN'
                      ? `☕ Dine-In (${order.tableNumber})`
                      : 'Takeaway Counter'}
                  </div>
                </div>
                <span className={`status-badge ${order.status}`}>{order.status}</span>
              </div>

              {/* Delivery Details Block */}
              {(order.phone || order.deliveryAddress || order.deliveryNotes) && (
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.8rem' }}>
                  {order.phone && <div>📞 <strong>Phone:</strong> {order.phone}</div>}
                  {order.deliveryAddress && <div style={{ marginTop: '2px' }}>📍 <strong>Address:</strong> {order.deliveryAddress}</div>}
                  {order.deliveryNotes && <div style={{ marginTop: '2px', color: 'var(--text-muted)', fontStyle: 'italic' }}>📝 "{order.deliveryNotes}"</div>}
                </div>
              )}

              <div className="order-items-list">
                {order.items.map((item) => (
                  <div key={item.id} className="order-item-row">
                    <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{item.quantity}x</span>
                    <span style={{ flex: 1, marginLeft: '8px' }}>{item.menuItem.name}</span>
                  </div>
                ))}
              </div>

              {/* Status Action Buttons */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingTop: '10px' }}>
                {order.status === 'PENDING' && (
                  <button
                    className="btn-primary"
                    style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}
                    onClick={() => onUpdateOrderStatus(order.id, 'IN_PROGRESS')}
                  >
                    <Flame size={14} />
                    <span>Start Preparing</span>
                  </button>
                )}

                {order.status === 'IN_PROGRESS' && (
                  order.orderType === 'DELIVERY' ? (
                    <button
                      className="btn-primary"
                      style={{ flex: 1, fontSize: '0.8rem', padding: '8px', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
                      onClick={() => onUpdateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                    >
                      <CheckCircle2 size={14} />
                      <span>Dispatch for Delivery 🚚</span>
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{ flex: 1, fontSize: '0.8rem', padding: '8px', background: 'linear-gradient(135deg, #10B981, #059669)' }}
                      onClick={() => onUpdateOrderStatus(order.id, 'READY')}
                    >
                      <CheckCircle2 size={14} />
                      <span>Mark Ready</span>
                    </button>
                  )
                )}

                {order.status === 'OUT_FOR_DELIVERY' && (
                  <button
                    className="btn-primary"
                    style={{ flex: 1, fontSize: '0.8rem', padding: '8px', background: 'linear-gradient(135deg, #10B981, #059669)' }}
                    onClick={() => onUpdateOrderStatus(order.id, 'COMPLETED')}
                  >
                    <span>Mark Delivered</span>
                  </button>
                )}

                {order.status === 'READY' && (
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}
                    onClick={() => onUpdateOrderStatus(order.id, 'COMPLETED')}
                  >
                    <span>Complete Order</span>
                  </button>
                )}

                {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                  <button
                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '999px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}
                    onClick={() => onUpdateOrderStatus(order.id, 'CANCELLED')}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ingredient Stock Monitor with Restock Controls */}
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Ingredient Stock & Inventory Monitor</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Monitor ingredient stock levels and quickly restock supplies when inventory runs low.
          </p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Current Stock</th>
              <th>Reorder Threshold</th>
              <th>Stock Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => {
              const stockNum = Number(ing.currentStock);
              const threshNum = Number(ing.reorderThreshold);
              const isLow = ing.isLowStock ?? (stockNum <= threshNum);

              return (
                <tr key={ing.id}>
                  <td style={{ fontWeight: 700 }}>{ing.name}</td>
                  <td style={{ fontWeight: 800, color: isLow ? '#EF4444' : 'var(--text-primary)' }}>
                    {stockNum} {ing.unit}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {threshNum} {ing.unit}
                  </td>
                  <td>
                    {isLow ? (
                      <span
                        className="stock-badge low-stock"
                        style={{
                          background: 'rgba(239, 68, 68, 0.25)',
                          color: '#FCA5A5',
                          border: '1px solid rgba(239, 68, 68, 0.45)',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        ⚠️ Low Stock
                      </span>
                    ) : (
                      <span
                        className="stock-badge in-stock"
                        style={{
                          background: 'rgba(16, 185, 129, 0.18)',
                          color: '#10B981',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        ✅ Normal
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                      onClick={() => setRestockIngredient(ing)}
                    >
                      <PlusCircle size={14} />
                      <span>Restock</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Staff Restock Modal */}
      {restockIngredient && (
        <div className="modal-overlay" onClick={() => setRestockIngredient(null)}>
          <div className="modal-box" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Restock: {restockIngredient.name}</h3>
              <button className="btn-close" onClick={() => setRestockIngredient(null)}>✕</button>
            </div>
            <form onSubmit={handleRestockSubmit}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div>Current Stock: <strong>{restockIngredient.currentStock} {restockIngredient.unit}</strong></div>
                <div>Reorder Threshold: <strong>{restockIngredient.reorderThreshold} {restockIngredient.unit}</strong></div>
              </div>
              <div className="form-group">
                <label className="form-label">Add Quantity ({restockIngredient.unit}) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 500"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loadingRestock}>
                {loadingRestock ? 'Updating Stock...' : 'Confirm Kitchen Restock'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
