export const ROLES = ['CUSTOMER', 'STAFF', 'ADMIN'] as const;

export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface CustomerAddress {
  id: string;
  userId?: string;
  label: string; // Home, Work, Other
  street: string;
  aptSuite?: string | null;
  city: string;
  zipCode: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  createdAt?: string;
  addresses?: CustomerAddress[];
}

export interface Ingredient {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  reorderThreshold: number;
  costPerUnit: number;
  isLowStock?: boolean;
}

export interface MenuItemIngredient {
  id?: string;
  ingredientId: string;
  quantityRequired: number;
  ingredient?: Ingredient;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string | null;
  isAvailable: boolean;
  availableStock?: number;
  isStockAvailable?: boolean;
  recipe?: MenuItemIngredient[];
}

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED';
export type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN' | 'TAKEAWAY';

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  menuItem: MenuItem;
}

export interface Order {
  id: string;
  userId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  phone?: string | null;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  deliveryFee?: number | null;
  tableNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  category: string;
  address: string;
}

export interface StockTransaction {
  id: string;
  ingredientId: string;
  quantityChange: number;
  type: 'RESTOCK' | 'ORDER_DEDUCTION' | 'WASTE' | 'ADJUSTMENT';
  reason?: string;
  createdAt: string;
  ingredient: Ingredient;
  performedBy?: { name: string; email: string };
}

export interface SalesReportSummary {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
}

export interface PopularItemSales {
  name: string;
  category: string;
  count: number;
  revenue: number;
}

export interface IngredientTrend {
  ingredient: string;
  totalUsed: number;
  wasteCount: number;
  unit: string;
}

// Runtime dummy object exports for Vite ES module loader compatibility
export const User = {};
export const MenuItem = {};
export const Order = {};
export const Ingredient = {};
export const Supplier = {};
export const CartItem = {};
export const OrderItem = {};
