import React, { useState } from 'react';
import { Search, Plus, Info, ChevronRight, Clock, Flame, Coffee, Truck } from 'lucide-react';
import type { MenuItem, Order, User } from '../types';

interface CustomerDashboardProps {
  menuItems: MenuItem[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddToCart: (item: MenuItem) => void;
  onTrackOrder: (orderId?: string) => void;
  orders?: Order[];
  currentUser?: User | null;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  menuItems,
  categories,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onTrackOrder,
  orders = [],
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRecipeItem, setActiveRecipeItem] = useState<MenuItem | null>(null);

  // Find live active in-progress order for current user / customer
  const activeOrders = orders.filter((o) =>
    ['PENDING', 'IN_PROGRESS', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status) &&
    (!currentUser || o.userId === currentUser.id || (currentUser.email && o.customerEmail?.toLowerCase() === currentUser.email.toLowerCase()) || o.customerName === currentUser.name)
  );
  const currentActiveOrder = activeOrders[0];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '12px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <span>🚚 Express Home Delivery & Pickup Available</span>
        </div>
        <h1 className="hero-title">Crafted Brews Delivered to Your Doorstep</h1>
        <p className="hero-subtitle">
          Enjoy artisanal coffees, teas, and fresh pastries from home. Order online for instant home delivery or easy store pickup!
        </p>
        {currentActiveOrder && (
          <button
            className="btn-primary"
            style={{ marginTop: '20px' }}
            onClick={() => onTrackOrder(currentActiveOrder.id)}
          >
            Track Active Order (#{currentActiveOrder.id.slice(0, 8)}) ➔
          </button>
        )}
      </div>

      {/* Rebuilt Dashboard-Level Live Order Tracker Banner (Bug 9) */}
      {currentActiveOrder && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(16, 185, 129, 0.15))',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#F59E0B',
                  boxShadow: '0 0 10px #F59E0B',
                }}
              ></span>
              <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.82rem', letterSpacing: '0.05em', color: 'var(--accent-amber)' }}>
                Active Order In Progress
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                #{currentActiveOrder.id.slice(0, 8)}
              </span>
            </div>

            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentActiveOrder.status === 'PENDING' && (
                <>
                  <Clock size={20} color="#F59E0B" />
                  <span>Order Received — Sent to Barista & Kitchen</span>
                </>
              )}
              {currentActiveOrder.status === 'IN_PROGRESS' && (
                <>
                  <Flame size={20} color="#3B82F6" />
                  <span>Preparing Order — Baristas crafting your brew</span>
                </>
              )}
              {currentActiveOrder.status === 'READY' && (
                <>
                  <Coffee size={20} color="#10B981" />
                  <span>Ready for Pickup — Fresh & Ready at Counter</span>
                </>
              )}
              {currentActiveOrder.status === 'OUT_FOR_DELIVERY' && (
                <>
                  <Truck size={20} color="#10B981" />
                  <span>Out for Delivery — Driver on the way!</span>
                </>
              )}
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {currentActiveOrder.items?.map((i) => `${i.quantity}x ${i.menuItem?.name || 'Item'}`).join(', ')} • <strong style={{ color: 'var(--accent-amber)' }}>${currentActiveOrder.totalAmount.toFixed(2)}</strong>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', fontSize: '0.9rem' }}
            onClick={() => onTrackOrder(currentActiveOrder.id)}
          >
            <span>Live Order Tracker</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Search & Category Filter */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '28px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '42px', borderRadius: 'var(--radius-pill)' }}
            placeholder="Search menu (e.g., Espresso, Matcha, Croissant)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-bar" style={{ margin: 0, padding: 0 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid (Bug 10 Overhaul & Alignment) */}
      <div className="menu-grid">
        {filteredItems.map((item) => {
          const portions = item.availableStock ?? 0;
          const isOutOfStock = !item.isAvailable || portions === 0;

          return (
            <div key={item.id} className="menu-card" style={{ opacity: isOutOfStock ? 0.75 : 1 }}>
              <div className="menu-card-img-wrapper">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="menu-card-img" />
                ) : (
                  <div className="menu-card-img-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2.2rem', background: '#1f293d' }}>
                    ☕
                  </div>
                )}
                {isOutOfStock ? (
                  <span className="stock-badge out-of-stock">Out of Stock</span>
                ) : (
                  <span className="stock-badge in-stock">{portions} Portions Left</span>
                )}
              </div>

              <div className="menu-card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {item.category}
                  </span>
                  <span className="menu-card-price">${item.price.toFixed(2)}</span>
                </div>

                <h3 className="menu-card-title">{item.name}</h3>
                <p className="menu-card-desc">{item.description}</p>

                <div className="menu-card-footer" style={{ gap: '8px', paddingTop: '12px' }}>
                  {item.recipe && item.recipe.length > 0 && (
                    <button
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      onClick={() => setActiveRecipeItem(item)}
                      title="View Ingredients"
                    >
                      <Info size={16} />
                    </button>
                  )}
                  <button
                    className="btn-primary"
                    style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
                    onClick={() => onAddToCart(item)}
                    disabled={isOutOfStock}
                  >
                    <Plus size={16} />
                    <span>{isOutOfStock ? 'Sold Out' : 'Add to Order'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe Modal */}
      {activeRecipeItem && (
        <div className="modal-overlay" onClick={() => setActiveRecipeItem(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Recipe Details: {activeRecipeItem.name}</h3>
              <button className="btn-close" onClick={() => setActiveRecipeItem(null)}>
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Fresh ingredients used per serving:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeRecipeItem.recipe?.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{r.ingredient?.name || 'Ingredient'}</span>
                  <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
                    {r.quantityRequired} {r.ingredient?.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
