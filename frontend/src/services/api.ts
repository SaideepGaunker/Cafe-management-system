const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('cafe_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  get: async (endpoint: string) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Request failed');
      return data;
    } catch (error: any) {
      console.error(`GET ${endpoint} error:`, error);
      throw error;
    }
  },

  post: async (endpoint: string, body: any) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Request failed');
      return data;
    } catch (error: any) {
      // Offline fallback handling for order placement if network fails or offline
      const isNetworkError = !navigator.onLine || error.message?.includes('fetch') || error.message?.includes('Network') || error.name === 'TypeError';
      if (endpoint === '/orders' && isNetworkError) {
        saveOfflineOrder(body);
        return {
          isOfflineSaved: true,
          message: 'Network offline. Order queued locally and will sync automatically!',
          order: {
            id: `offline-${Date.now()}`,
            customerName: body.customerName,
            tableNumber: body.tableNumber || 'Counter',
            orderType: body.orderType || 'TAKEAWAY',
            status: 'PENDING',
            totalAmount: 0,
            createdAt: new Date().toISOString(),
            items: [],
          },
        };
      }
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  },

  put: async (endpoint: string, body: any) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Request failed');
      return data;
    } catch (error: any) {
      console.error(`PUT ${endpoint} error:`, error);
      throw error;
    }
  },

  patch: async (endpoint: string, body: any) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Request failed');
      return data;
    } catch (error: any) {
      console.error(`PATCH ${endpoint} error:`, error);
      throw error;
    }
  },

  delete: async (endpoint: string) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      };
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Request failed');
      return data;
    } catch (error: any) {
      console.error(`DELETE ${endpoint} error:`, error);
      throw error;
    }
  },
};

// Helper for offline queue
function saveOfflineOrder(orderPayload: any) {
  const offlineOrders = JSON.parse(localStorage.getItem('cafe_offline_orders') || '[]');
  offlineOrders.push(orderPayload);
  localStorage.setItem('cafe_offline_orders', JSON.stringify(offlineOrders));
}

export async function processOfflineOrderQueue() {
  const offlineOrders = JSON.parse(localStorage.getItem('cafe_offline_orders') || '[]');
  if (offlineOrders.length === 0) return 0;

  let processedCount = 0;
  const remainingOrders = [];

  for (const orderPayload of offlineOrders) {
    try {
      await api.post('/orders', orderPayload);
      processedCount++;
    } catch (err) {
      console.error('Failed to sync offline order:', err);
      remainingOrders.push(orderPayload);
    }
  }

  localStorage.setItem('cafe_offline_orders', JSON.stringify(remainingOrders));
  return processedCount;
}
