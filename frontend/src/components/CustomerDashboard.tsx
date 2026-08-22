import React, { useState } from 'react';
import { Search, Plus, Info } from 'lucide-react';
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

  const activeOrders = orders.filter((o) =>
    ['PENDING', 'IN_PROGRESS', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status) &&
    (!currentUser || o.userId === currentUser.id || (currentUser.email && o.customerEmail?.toLowerCase() === currentUser.email.toLowerCase()) || o.customerName === currentUser.name)
  );
  const currentActiveOrder = activeOrders[0];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
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

      {/* Search & Category Filter */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
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

      {/* Menu Items Grid */}
      <div className="menu-grid">
        {filteredItems.map((item) => {
          const portions = item.availableStock ?? 0;
          const isOutOfStock = !item.isAvailable || portions === 0;

          return (
            <div key={item.id} className="menu-card" style={{ opacity: isOutOfStock ? 0.75 : 1 }}>
              <div className="menu-card-img-wrap">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="menu-card-img" />
                ) : (
                  <div className="menu-card-img-placeholder">
                    ☕
                  </div>
                )}
                {isOutOfStock ? (
                  <span className="stock-badge out">Out of Stock</span>
                ) : (
                  <span className="stock-badge in">{portions} Portions Left</span>
                )}
              </div>

              <div className="menu-card-body">
                <div className="menu-card-header">
                  <span className="menu-card-category">{item.category}</span>
                  <span className="menu-card-price">${item.price.toFixed(2)}</span>
                </div>

                <h3 className="menu-card-title">{item.name}</h3>
                <p className="menu-card-desc">{item.description}</p>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px' }}>
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
