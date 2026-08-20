import React, { useState } from 'react';
import { Search, Plus, Info } from 'lucide-react';
import type { MenuItem } from '../types';

interface CustomerDashboardProps {
  menuItems: MenuItem[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddToCart: (item: MenuItem) => void;
  onTrackOrder: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  menuItems,
  categories,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onTrackOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRecipeItem, setActiveRecipeItem] = useState<MenuItem | null>(null);

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
        <button
          className="btn-primary"
          style={{ marginTop: '20px' }}
          onClick={onTrackOrder}
        >
          Track Active Order ➔
        </button>
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
          const isLowStock = portions > 0 && portions <= 5;

          return (
            <div key={item.id} className="menu-card">
              <div className="menu-card-img-wrapper">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="menu-card-img" />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    No Image
                  </div>
                )}

                {/* Stock Badge */}
                {isOutOfStock ? (
                  <span className="stock-badge out-of-stock">Sold Out</span>
                ) : isLowStock ? (
                  <span className="stock-badge low-stock">Low Stock ({portions} left)</span>
                ) : (
                  <span className="stock-badge in-stock">In Stock ({portions} ready)</span>
                )}
              </div>

              <div className="menu-card-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {item.category}
                  </span>
                  {item.recipe && item.recipe.length > 0 && (
                    <button
                      onClick={() => setActiveRecipeItem(item)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-amber)', cursor: 'pointer' }}
                      title="View Ingredients & Recipe"
                    >
                      <Info size={16} />
                    </button>
                  )}
                </div>

                <div className="menu-card-title">{item.name}</div>
                <div className="menu-card-desc">{item.description}</div>

                <div className="menu-card-footer">
                  <div className="menu-card-price">${item.price.toFixed(2)}</div>
                  <button
                    className="btn-add-cart"
                    disabled={isOutOfStock}
                    onClick={() => onAddToCart(item)}
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

      {/* Recipe Info Modal */}
      {activeRecipeItem && (
        <div className="modal-overlay" onClick={() => setActiveRecipeItem(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{activeRecipeItem.name} - Recipe Details</h3>
              <button className="btn-close" onClick={() => setActiveRecipeItem(null)}>✕</button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Ingredient breakdown & required quantities per serving:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeRecipeItem.recipe?.map((r) => (
                <div
                  key={r.ingredientId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>☕ {r.ingredient?.name}</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>
                    {r.quantityRequired} {r.ingredient?.unit}
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
