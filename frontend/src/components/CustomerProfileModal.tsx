import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, MapPin, Plus, Trash2, Edit2, CheckCircle, Package, Home, Briefcase } from 'lucide-react';
import type { User, CustomerAddress, Order } from '../types';
import { api } from '../services/api';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdateUser: (updatedUser: User) => void;
  orders: Order[];
  onTrackOrder: (orderId: string) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  orders,
  onTrackOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');

  // Profile Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Address Form State
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    street: '',
    aptSuite: '',
    city: '',
    zipCode: '',
    isDefault: false,
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  if (!isOpen || !currentUser) return null;

  const userOrders = orders.filter((o) => o.userId === currentUser.id || o.customerName === currentUser.name);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);

    try {
      const res = await api.put('/auth/profile', { name, phone });
      onUpdateUser(res.user);
      setProfileMsg({ type: 'success', text: 'Personal details updated successfully!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Open Add Address Modal
  const openAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: 'Home',
      street: '',
      aptSuite: '',
      city: '',
      zipCode: '',
      isDefault: currentUser.addresses?.length === 0,
    });
    setIsAddAddressOpen(true);
  };

  // Handle Open Edit Address Modal
  const openEditAddress = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label,
      street: addr.street,
      aptSuite: addr.aptSuite || '',
      city: addr.city,
      zipCode: addr.zipCode,
      isDefault: addr.isDefault,
    });
    setIsAddAddressOpen(true);
  };

  // Handle Save Address (Create or Edit)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);

    try {
      if (editingAddressId) {
        await api.put(`/auth/addresses/${editingAddressId}`, addressForm);
      } else {
        await api.post('/auth/addresses', addressForm);
      }

      // Refresh user profile with new addresses
      const meRes = await api.get('/auth/me');
      onUpdateUser(meRes.user);
      setIsAddAddressOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Handle Delete Address
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this delivery address?')) return;
    try {
      await api.delete(`/auth/addresses/${addressId}`);
      const meRes = await api.get('/auth/me');
      onUpdateUser(meRes.user);
    } catch (err: any) {
      alert(err.message || 'Failed to delete address');
    }
  };

  // Handle Set Default Address
  const handleSetDefaultAddress = async (addr: CustomerAddress) => {
    try {
      await api.put(`/auth/addresses/${addr.id}`, { isDefault: true });
      const meRes = await api.get('/auth/me');
      onUpdateUser(meRes.user);
    } catch (err: any) {
      alert(err.message || 'Failed to set default address');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '720px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-gold))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: 800,
                fontSize: '1.2rem',
              }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="modal-title">{currentUser.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>{currentUser.email}</span>
                <span>•</span>
                <span className={`role-badge ${currentUser.role.toLowerCase()}`}>{currentUser.role}</span>
              </div>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="category-bar" style={{ margin: '16px 0 24px 0' }}>
          <button
            className={`category-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <UserIcon size={16} />
            <span>Personal Profile</span>
          </button>
          <button
            className={`category-btn ${activeTab === 'addresses' ? 'active' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            <MapPin size={16} />
            <span>Saved Addresses ({(currentUser.addresses || []).length})</span>
          </button>
          <button
            className={`category-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={16} />
            <span>Order History ({userOrders.length})</span>
          </button>
        </div>

        {/* 1. PERSONAL PROFILE TAB */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile}>
            {profileMsg && (
              <div
                className="alert-banner"
                style={{
                  background: profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: profileMsg.type === 'success' ? '#10B981' : '#EF4444',
                  borderColor: profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                  marginBottom: '16px',
                }}
              >
                <span>{profileMsg.text}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Account ID)</label>
                <input
                  type="email"
                  className="form-input"
                  value={currentUser.email}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Phone Number (for delivery alerts)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={isSavingProfile}>
              <CheckCircle size={18} />
              <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        )}

        {/* 2. SAVED ADDRESSES TAB */}
        {activeTab === 'addresses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Delivery Address Book</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Saved addresses automatically populate during online checkout.
                </p>
              </div>
              <button className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={openAddAddress}>
                <Plus size={16} />
                <span>Add Address</span>
              </button>
            </div>

            {(!currentUser.addresses || currentUser.addresses.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <MapPin size={36} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No saved delivery addresses</p>
                <button className="btn-secondary" style={{ marginTop: '12px', fontSize: '0.8rem' }} onClick={openAddAddress}>
                  + Add Your First Address
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {currentUser.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '14px',
                      borderRadius: '12px',
                      border: addr.isDefault ? '1px solid var(--accent-amber)' : '1px solid var(--border-color)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.95rem' }}>
                          {addr.label === 'Work' ? <Briefcase size={16} /> : <Home size={16} />}
                          <span>{addr.label}</span>
                        </div>
                        {addr.isDefault && (
                          <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                            Default
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {addr.street} {addr.aptSuite ? `, ${addr.aptSuite}` : ''}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {addr.city}, {addr.zipCode}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                      {!addr.isDefault && (
                        <button
                          style={{ fontSize: '0.75rem', background: 'transparent', border: 'none', color: 'var(--accent-amber)', cursor: 'pointer' }}
                          onClick={() => handleSetDefaultAddress(addr)}
                        >
                          Set Default
                        </button>
                      )}
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                        <button
                          style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          onClick={() => openEditAddress(addr)}
                          title="Edit Address"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          style={{ padding: '4px', background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                          onClick={() => handleDeleteAddress(addr.id)}
                          title="Delete Address"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. ORDER HISTORY TAB */}
        {activeTab === 'orders' && (
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Your Past Orders</h3>
            {userOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <Package size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <p>No order history found</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userOrders.map((ord) => (
                  <div key={ord.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-amber)' }}>#{ord.id.slice(0, 8)}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                          {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`status-badge ${ord.status}`}>{ord.status}</span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {ord.orderType === 'DELIVERY' ? (
                        <span>🚚 Home Delivery ({ord.deliveryAddress || 'Address on file'})</span>
                      ) : (
                        <span>🛍️ Store Pickup / In-Store</span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {ord.items.map((i) => (
                        <span key={i.id} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                          {i.quantity}x {i.menuItem?.name || 'Item'}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-amber)' }}>
                        Total: ${ord.totalAmount.toFixed(2)}
                      </span>
                      {ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED' && (
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                          onClick={() => {
                            onClose();
                            onTrackOrder(ord.id);
                          }}
                        >
                          Track Live Order ➔
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add / Edit Address Sub-Modal */}
        {isAddAddressOpen && (
          <div className="modal-overlay" onClick={() => setIsAddAddressOpen(false)}>
            <div className="modal-box" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}</h3>
                <button className="btn-close" onClick={() => setIsAddAddressOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveAddress}>
                <div className="form-group">
                  <label className="form-label">Address Label</label>
                  <select
                    className="form-select"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 742 Evergreen Terrace"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Apartment / Suite (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Apt 4B"
                    value={addressForm.aptSuite}
                    onChange={(e) => setAddressForm({ ...addressForm, aptSuite: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Springfield"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ZIP / Postal Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 97477"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="checkbox"
                    id="isDefaultCheck"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  />
                  <label htmlFor="isDefaultCheck" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                    Set as default delivery address
                  </label>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isSavingAddress}>
                  {isSavingAddress ? 'Saving Address...' : 'Save Address'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
