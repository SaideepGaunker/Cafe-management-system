import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { CustomerDashboard } from './components/CustomerDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { OfflineCounterPos } from './components/OfflineCounterPos';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { EmployeePortalPage } from './pages/EmployeePortalPage';
import { CartDrawer } from './components/CartDrawer';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { ToastContainer } from './components/ToastContainer';
import type { ToastMessage } from './components/ToastContainer';
import type { MenuItem, Ingredient, Order, CartItem, User, OrderStatus } from './types';
import { api, processOfflineOrderQueue } from './services/api';
import { socket, updateSocketAuthToken, joinOrderTrackingRoom } from './services/socket';

const MainAppLayout: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cafe_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(() => {
    return !!localStorage.getItem('cafe_auth_token') && !localStorage.getItem('cafe_user');
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cafe_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(() => {
    return localStorage.getItem('cafe_tracked_order_id') || null;
  });

  const updateTrackedOrderId = (id: string | null) => {
    setTrackedOrderId(id);
    if (id) {
      localStorage.setItem('cafe_tracked_order_id', id);
    } else {
      localStorage.removeItem('cafe_tracked_order_id');
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('cafe_cart_items', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  useEffect(() => {
    if (trackedOrderId) {
      joinOrderTrackingRoom(trackedOrderId);
    }
  }, [trackedOrderId]);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueLength, setOfflineQueueLength] = useState(0);

  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const checkOfflineQueue = () => {
    const queue = JSON.parse(localStorage.getItem('cafe_offline_orders') || '[]');
    setOfflineQueueLength(queue.length);
  };

  const fetchData = async () => {
    try {
      const menuRes = await api.get('/menu');
      setMenuItems(menuRes.menuItems);

      const uniqueCats = ['All', ...Array.from(new Set(menuRes.menuItems.map((i: MenuItem) => i.category))) as string[]];
      setCategories(uniqueCats);

      const token = localStorage.getItem('cafe_auth_token');
      if (token) {
        updateSocketAuthToken(token);
        try {
          const meRes = await api.get('/auth/me');
          setCurrentUser(meRes.user);
          localStorage.setItem('cafe_user', JSON.stringify(meRes.user));

          if (meRes.user.role === 'STAFF' || meRes.user.role === 'ADMIN') {
            const ingRes = await api.get('/inventory');
            setIngredients(ingRes.ingredients);
          }

          const ordRes = await api.get('/orders');
          setOrders(ordRes.orders || []);
        } catch (err: any) {
          if (err?.message?.includes('Unauthorized') || err?.message?.includes('Invalid')) {
            localStorage.removeItem('cafe_auth_token');
            localStorage.removeItem('cafe_user');
            setCurrentUser(null);
          }
        } finally {
          setIsAuthLoading(false);
        }
      } else {
        setIsAuthLoading(false);
        try {
          const ordRes = await api.get('/orders');
          setOrders(ordRes.orders || []);
        } catch {}
      }
    } catch (error) {
      console.error('Data fetch error:', error);
    }
  };

  useEffect(() => {
    fetchData();
    checkOfflineQueue();

    const handleOnline = async () => {
      setIsOnline(true);
      const synced = await processOfflineOrderQueue();
      if (synced > 0) {
        addToast('Offline Sales Synced', `Successfully submitted ${synced} queued counter orders!`, 'success');
        fetchData();
      }
      checkOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast('Connection Lost', 'System switched to offline queuing mode.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const onOrderCreated = (newOrder: Order) => {
      fetchData();
      if (currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN') {
        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
        addToast('New Order Placed!', `Order #${newOrder.id.slice(0, 8)} by ${newOrder.customerName}`, 'info');
      } else if (currentUser && (newOrder.userId === currentUser.id || (currentUser.email && newOrder.customerEmail === currentUser.email))) {
        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
        updateTrackedOrderId(newOrder.id);
        addToast('Order Confirmation', `Your order #${newOrder.id.slice(0, 8)} has been placed successfully!`, 'success');
      }
    };

    const onOrderStatusUpdated = (updatedOrder: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      if (currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN') {
        addToast('Order Status Update', `Order #${updatedOrder.id.slice(0, 8)} is now ${updatedOrder.status}`, 'success');
      } else if (currentUser && (updatedOrder.userId === currentUser.id || (currentUser.email && updatedOrder.customerEmail === currentUser.email))) {
        addToast('Your Order Updated', `Your order #${updatedOrder.id.slice(0, 8)} is now ${updatedOrder.status}`, 'success');
      }
    };

    const onLowStockAlert = (alertData: { name: string; currentStock: number }) => {
      // ONLY Staff and Admin receive inventory low-stock alerts
      if (currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN') {
        addToast('Low Stock Alert!', `${alertData.name} has fallen to ${alertData.currentStock}`, 'alert');
      }
    };

    const onDataUpdated = () => {
      fetchData();
    };

    socket.on('orderCreated', onOrderCreated);
    socket.on('orderStatusUpdated', onOrderStatusUpdated);
    socket.on('lowStockAlert', onLowStockAlert);
    socket.on('dataUpdated', onDataUpdated);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.off('orderCreated', onOrderCreated);
      socket.off('orderStatusUpdated', onOrderStatusUpdated);
      socket.off('lowStockAlert', onLowStockAlert);
      socket.off('dataUpdated', onDataUpdated);
    };
  }, [currentUser]);

  const handleSyncOfflineOrders = async () => {
    try {
      const count = await processOfflineOrderQueue();
      checkOfflineQueue();
      if (count > 0) {
        addToast('Sync Complete', `Synced ${count} offline transactions to central database & inventory!`, 'success');
        fetchData();
      } else {
        addToast('Sync Complete', 'All offline transactions are up to date.', 'info');
      }
    } catch {
      addToast('Sync Error', 'Failed to sync offline sales to backend.', 'alert');
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!currentUser) {
      setIsCustomerAuthOpen(true);
      addToast('Sign In Required', 'Please sign in or create an account to place an order.', 'info');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (menuItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((ci) => {
          if (ci.menuItem.id === menuItemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (menuItemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.menuItem.id !== menuItemId));
  };

  const handleOrderPlaced = (order: Order, options?: { skipTracker?: boolean }) => {
    if (!options?.skipTracker) {
      updateTrackedOrderId(order.id);
    }
    setCartItems([]);
    try {
      localStorage.removeItem('cafe_cart_items');
    } catch {}
    addToast('Order Placed Successfully!', `Order #${order.id.slice(0, 8)} created`, 'success');
    checkOfflineQueue();
    fetchData();
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const token = localStorage.getItem('cafe_auth_token');
      if (!token) {
        addToast('Authentication Required', 'Please sign in to the Employee Portal to update order status.', 'alert');
        navigate('/staff-portal');
        return;
      }

      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchData();
    } catch (err: any) {
      if (err.message?.includes('Unauthorized') || err.message?.includes('Missing or invalid token')) {
        addToast('Session Expired', 'Please sign in to the Employee Portal to continue.', 'alert');
        navigate('/staff-portal');
      } else {
        addToast('Status Update Error', err.message || 'Failed to update order status', 'alert');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cafe_auth_token');
    updateSocketAuthToken(null);
    setCurrentUser(null);
    navigate('/');
    addToast('Logged Out', 'You have been logged out.', 'info');
  };

  const toggleMode = () => {
    const nextMode = mode === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    setMode(nextMode);
    if (nextMode === 'OFFLINE') {
      navigate('/offline-pos');
    } else {
      navigate('/');
    }
    addToast('Mode Switch', `Switched to ${nextMode === 'ONLINE' ? 'Online CMS Mode' : 'Offline POS Counter Mode'}`, 'info');
  };

  return (
    <div className="app-layout">
      <Routes>
        {/* Hidden Dedicated Employee Login Portal */}
        <Route
          path="/staff-portal"
          element={
            <EmployeePortalPage
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                fetchData();
              }}
            />
          }
        />

        {/* All main routes with Navbar layout */}
        <Route
          path="*"
          element={
            <>
              <Navbar
                mode={mode}
                onToggleMode={toggleMode}
                currentUser={currentUser}
                onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
                onOpenProfile={() => setIsProfileOpen(true)}
                onLogout={handleLogout}
                cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                onOpenCart={() => setIsCartOpen(true)}
                isOnline={isOnline}
                offlineQueueLength={offlineQueueLength}
                onSyncOffline={handleSyncOfflineOrders}
              />

              <main className="main-content">
                <Routes>
                  {/* Online Cafe Management System Storefront (Customer & Guest Only) */}
                  <Route
                    path="/"
                    element={
                      isAuthLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
                          Validating session...
                        </div>
                      ) : currentUser && currentUser.role === 'ADMIN' ? (
                        <Navigate to="/admin" replace />
                      ) : currentUser && currentUser.role === 'STAFF' ? (
                        <Navigate to="/kitchen" replace />
                      ) : (
                        <CustomerDashboard
                          menuItems={menuItems}
                          categories={categories}
                          selectedCategory={selectedCategory}
                          onSelectCategory={setSelectedCategory}
                          onAddToCart={handleAddToCart}
                          orders={orders}
                          currentUser={currentUser}
                          onTrackOrder={(targetOrderId?: string) => {
                            if (targetOrderId) {
                              updateTrackedOrderId(targetOrderId);
                            } else {
                              const activeOrder = orders.find((o) => ['PENDING', 'IN_PROGRESS', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status));
                              if (activeOrder) {
                                updateTrackedOrderId(activeOrder.id);
                              } else if (orders.length > 0) {
                                updateTrackedOrderId(orders[0].id);
                              } else if (trackedOrderId) {
                                // keep existing trackedOrderId
                              } else {
                                addToast('No Active Orders', 'Place an order first to track live status.', 'info');
                              }
                            }
                          }}
                        />
                      )
                    }
                  />

                  {/* Offline Counter POS Mode (Protected for Staff & Admin) */}
                  <Route
                    path="/offline-pos"
                    element={
                      isAuthLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
                          Validating session...
                        </div>
                      ) : currentUser && (currentUser.role === 'STAFF' || currentUser.role === 'ADMIN') ? (
                        <OfflineCounterPos
                          menuItems={menuItems}
                          onOrderPlaced={handleOrderPlaced}
                          onRefreshData={fetchData}
                          isOnline={isOnline}
                          offlineQueueLength={offlineQueueLength}
                        />
                      ) : (
                        <Navigate to="/staff-portal" replace />
                      )
                    }
                  />

                  {/* Shared Kitchen Queue (Protected for Staff & Admin) */}
                  <Route
                    path="/kitchen"
                    element={
                      isAuthLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
                          Validating session...
                        </div>
                      ) : currentUser && (currentUser.role === 'STAFF' || currentUser.role === 'ADMIN') ? (
                        <StaffDashboard
                          orders={orders}
                          ingredients={ingredients}
                          onUpdateOrderStatus={handleUpdateOrderStatus}
                          onRefreshData={fetchData}
                        />
                      ) : (
                        <Navigate to="/staff-portal" replace />
                      )
                    }
                  />

                  {/* Shared Admin Management Portal (Protected for Admin) */}
                  <Route
                    path="/admin"
                    element={
                      isAuthLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
                          Validating session...
                        </div>
                      ) : currentUser && currentUser.role === 'ADMIN' ? (
                        <AdminDashboard
                          menuItems={menuItems}
                          ingredients={ingredients}
                          onRefreshData={fetchData}
                        />
                      ) : (
                        <Navigate to="/staff-portal" replace />
                      )
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </>
          }
        />
      </Routes>

      {/* Customer Auth Modal */}
      <CustomerAuthModal
        isOpen={isCustomerAuthOpen}
        onClose={() => setIsCustomerAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          fetchData();
        }}
      />

      {/* Online Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        onOrderPlaced={handleOrderPlaced}
        isOnline={isOnline}
        currentUser={currentUser}
        onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
      />

      {/* Customer Profile & Address Management Modal */}
      <CustomerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)}
        orders={orders}
        onTrackOrder={(orderId) => updateTrackedOrderId(orderId)}
      />

      {/* Customer Order Tracker */}
      <OrderTrackerModal
        orderId={trackedOrderId}
        onClose={() => updateTrackedOrderId(null)}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <MainAppLayout />
    </BrowserRouter>
  );
};

export default App;
