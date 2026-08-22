import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle,
  WifiOff,
  ArrowLeft,
  ArrowRight,
  Truck,
  Store,
  MapPin,
  Sparkles,
  ShieldCheck,
  Coffee,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CartItem, Order, User } from '../types';
import { api } from '../services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (menuItemId: string, delta: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: Order) => void;
  isOnline: boolean;
  currentUser?: User | null;
  onOpenCustomerAuth?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  isOnline,
  currentUser,
  onOpenCustomerAuth,
}) => {
  const [step, setStep] = useState<'ITEMS' | 'CHECKOUT'>('ITEMS');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const FREE_DELIVERY_THRESHOLD = 25.0;
  const STANDARD_DELIVERY_FEE = 3.50;

  // Auto-fill customer profile details on drawer open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (currentUser?.name) setCustomerName(currentUser.name);
      if (currentUser?.email) setCustomerEmail(currentUser.email);
      if (currentUser?.phone) setPhone(currentUser.phone);
      if (currentUser?.addresses && currentUser.addresses.length > 0) {
        const defaultAddr = currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];
        setSelectedAddressId(defaultAddr.id);
        const formatted = `${defaultAddr.street}${defaultAddr.aptSuite ? `, ${defaultAddr.aptSuite}` : ''}, ${defaultAddr.city}, ${defaultAddr.zipCode}`;
        setDeliveryAddress(formatted);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const itemSubtotal = cartItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const isFreeDelivery = itemSubtotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = orderType === 'DELIVERY' ? (isFreeDelivery ? 0 : STANDARD_DELIVERY_FEE) : 0;
  const totalAmount = itemSubtotal + deliveryFee;
  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - itemSubtotal);

  const handleSelectSavedAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selected = currentUser?.addresses?.find((a) => a.id === addressId);
    if (selected) {
      const formatted = `${selected.street}${selected.aptSuite ? `, ${selected.aptSuite}` : ''}, ${selected.city}, ${selected.zipCode}`;
      setDeliveryAddress(formatted);
    }
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;
    if (!currentUser) {
      onClose();
      if (onOpenCustomerAuth) onOpenCustomerAuth();
      return;
    }
    setError(null);
    setStep('CHECKOUT');
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!currentUser) {
      onClose();
      if (onOpenCustomerAuth) onOpenCustomerAuth();
      return;
    }
    if (!customerName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setError('Please enter a valid email address to receive order confirmation & tracking updates');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your contact phone number');
      return;
    }
    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) {
      setError('Please enter your delivery address');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      customerName,
      customerEmail: customerEmail.trim() || null,
      phone,
      deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : null,
      deliveryNotes: deliveryNotes.trim() || null,
      deliveryFee,
      tableNumber: orderType === 'DELIVERY' ? 'Home Delivery' : 'Self Pickup',
      orderType,
      items: cartItems.map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
      })),
    };

    try {
      const res = await api.post('/orders', payload);

      // Confetti burst
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899'],
      });

      onClearCart();
      onOrderPlaced(res.order);
      setStep('ITEMS');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: 0 }}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Cart Drawer Header */}
        <div className="cart-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-amber)',
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Your Order Cart</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {totalCartCount > 0 ? `${totalCartCount} item${totalCartCount > 1 ? 's' : ''} selected` : 'Cart is empty'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {cartItems.length > 0 && step === 'ITEMS' && (
              <button
                onClick={onClearCart}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
                title="Clear all items"
              >
                Clear Cart
              </button>
            )}
            <button className="btn-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Free Delivery Progress Bar */}
        {cartItems.length > 0 && (
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 18px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px', fontWeight: 600 }}>
              {isFreeDelivery ? (
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={14} /> 🎉 You unlocked FREE Express Delivery!
                </span>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>
                  Add <strong style={{ color: 'var(--accent-amber)' }}>${amountNeededForFreeDelivery.toFixed(2)}</strong> more for <strong>FREE Delivery</strong>
                </span>
              )}
              <span style={{ color: 'var(--text-muted)' }}>${itemSubtotal.toFixed(2)} / ${FREE_DELIVERY_THRESHOLD.toFixed(2)}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (itemSubtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`,
                  height: '100%',
                  background: isFreeDelivery
                    ? 'linear-gradient(90deg, #10B981, #34D399)'
                    : 'linear-gradient(90deg, var(--accent-amber), var(--accent-gold))',
                  transition: 'width 0.4s ease',
                  borderRadius: '999px',
                }}
              />
            </div>
          </div>
        )}

        {/* Offline Banner & Errors */}
        <div className="cart-drawer-body">
          {!isOnline && (
            <div className="alert-banner" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)', marginBottom: '16px' }}>
              <WifiOff size={18} />
              <span>Offline mode: Orders will be queued and submitted automatically when connection returns.</span>
            </div>
          )}

          {error && (
            <div className="alert-banner" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: '16px' }}>
              <span>{error}</span>
            </div>
          )}

          {cartItems.length === 0 ? (
            /* EMPTY CART VIEW */
            <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                }}
              >
                <Coffee size={40} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>Your cart is currently empty</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '300px', marginBottom: '24px' }}>
                Discover our artisanal coffees, specialty teas, and freshly baked French pastries.
              </p>
              <button className="btn-primary" onClick={onClose} style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
                Explore Cafe Menu ➔
              </button>
            </div>
          ) : step === 'ITEMS' ? (
            /* STEP 1: REVIEW CART ITEMS VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cartItems.map((item) => (
                <div key={item.menuItem.id} className="cart-item">
                  {item.menuItem.image ? (
                    <img src={item.menuItem.image} alt={item.menuItem.name} className="cart-item-img" />
                  ) : (
                    <div className="cart-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                      ☕
                    </div>
                  )}

                  <div className="cart-item-details">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                      {item.menuItem.category}
                    </div>
                    <div className="cart-item-name">{item.menuItem.name}</div>
                    <div className="cart-item-price">
                      ${(item.menuItem.price * item.quantity).toFixed(2)}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>
                        (${item.menuItem.price.toFixed(2)} ea)
                      </span>
                    </div>
                  </div>

                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => onUpdateQty(item.menuItem.id, -1)} title="Decrease quantity">
                      <Minus size={14} />
                    </button>
                    <span className="qty-val">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => onUpdateQty(item.menuItem.id, 1)}
                      disabled={item.quantity >= (item.menuItem.availableStock ?? 999)}
                      title="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.menuItem.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* STEP 2: CHECKOUT & DELIVERY DETAILS FORM */
            <form id="checkout-form" onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Back to Items Button */}
              <button
                type="button"
                onClick={() => setStep('ITEMS')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-amber)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Cart Items</span>
              </button>

              {/* Order Method Cards */}
              <div>
                <label className="form-label">Delivery Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setOrderType('DELIVERY')}
                    style={{
                      border: orderType === 'DELIVERY' ? '2px solid var(--accent-amber)' : '1px solid var(--border-color)',
                      background: orderType === 'DELIVERY' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>
                      <Truck size={18} color="var(--accent-amber)" />
                      <span>Home Delivery</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {isFreeDelivery ? 'FREE Express Delivery' : '+$3.50 Delivery Fee'} (25-35 mins)
                    </div>
                  </div>

                  <div
                    onClick={() => setOrderType('PICKUP')}
                    style={{
                      border: orderType === 'PICKUP' ? '2px solid var(--accent-amber)' : '1px solid var(--border-color)',
                      background: orderType === 'PICKUP' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>
                      <Store size={18} color="#10B981" />
                      <span>Store Pickup</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Free • Ready in ~15 mins
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. John Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address (for order status notifications)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. customer@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>

              {/* Delivery Details */}
              {orderType === 'DELIVERY' ? (
                <>
                  {/* Saved Address Selector */}
                  {currentUser?.addresses && currentUser.addresses.length > 0 && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Select Saved Address</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {currentUser.addresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => handleSelectSavedAddress(addr.id)}
                              style={{
                                border: isSelected ? '1px solid var(--accent-amber)' : '1px solid var(--border-color)',
                                background: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                color: isSelected ? 'var(--accent-amber)' : 'var(--text-secondary)',
                                padding: '6px 12px',
                                borderRadius: '999px',
                                fontSize: '0.78rem',
                                fontWeight: isSelected ? 700 : 500,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <MapPin size={12} />
                              <span>{addr.label}: {addr.street}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Delivery Address *</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Street address, Apt/Suite, City, ZIP Code"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Delivery Instructions (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ring bell, leave on front porch"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pickup Notes (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Arriving in ~20 minutes"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                  />
                </div>
              )}
            </form>
          )}
        </div>

        {/* Cart Drawer Footer Sticky Bar */}
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            {step === 'ITEMS' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '1.1rem', fontWeight: 800 }}>
                  <span>Subtotal ({totalCartCount} item{totalCartCount > 1 ? 's' : ''})</span>
                  <span style={{ color: 'var(--accent-amber)' }}>${itemSubtotal.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '1rem', padding: '14px' }}
                  onClick={handleProceedToCheckout}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div>
                {/* Price Breakdown */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '12px', marginBottom: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Items Subtotal</span>
                    <span>${itemSubtotal.toFixed(2)}</span>
                  </div>
                  {orderType === 'DELIVERY' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>Express Delivery Fee</span>
                      <span style={{ color: isFreeDelivery ? '#10B981' : 'var(--text-primary)', fontWeight: isFreeDelivery ? 700 : 400 }}>
                        {isFreeDelivery ? 'FREE (Unlocked!)' : `$${STANDARD_DELIVERY_FEE.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '6px', borderTop: '1px solid var(--border-color)', fontSize: '1.15rem', fontWeight: 800 }}>
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--accent-amber)' }}>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} color="#10B981" /> Encrypted Checkout
                  </span>
                  <span>•</span>
                  <span>⚡ Instant Order Dispatch</span>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '1rem', padding: '14px' }}
                  disabled={loading}
                >
                  <CheckCircle size={18} />
                  <span>{loading ? 'Placing Order...' : orderType === 'DELIVERY' ? 'Confirm Delivery Order 🚀' : 'Confirm Pickup Order 🚀'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
