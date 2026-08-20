import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, TrendingUp, BarChart3, PieChart, Download, Loader2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { MenuItem, Ingredient, Supplier, User, SalesReportSummary, PopularItemSales, IngredientTrend } from '../types';
import { api } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AdminDashboardProps {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  menuItems,
  ingredients,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'inventory' | 'analytics' | 'users' | 'suppliers'>('menu');

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Hot Coffee',
    image: '',
    isAvailable: true,
  });
  const [recipeForm, setRecipeForm] = useState<{ ingredientId: string; quantityRequired: number }[]>([]);

  // Inventory Management State
  const [isIngModalOpen, setIsIngModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingForm, setIngForm] = useState({
    name: '',
    currentStock: '',
    unit: 'g',
    reorderThreshold: '10',
    costPerUnit: '0',
  });
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockIng, setRestockIng] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockType, setRestockType] = useState<'RESTOCK' | 'ADJUSTMENT' | 'WASTE'>('RESTOCK');
  const [restockReason, setRestockReason] = useState('');
  const [stockTransactions, setStockTransactions] = useState<any[]>([]);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [staffError, setStaffError] = useState<string | null>(null);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    setIsCreatingStaff(true);
    try {
      await api.post('/auth/register', {
        name: staffForm.name,
        email: staffForm.email,
        password: staffForm.password,
        phone: staffForm.phone,
        role: 'STAFF',
      });
      setIsStaffModalOpen(false);
      setStaffForm({ name: '', email: '', password: '', phone: '' });
      api.get('/auth/users').then((res) => setUsers(res.users)).catch(console.error);
    } catch (err: any) {
      setStaffError(err?.message || 'Failed to create staff account');
    } finally {
      setIsCreatingStaff(false);
    }
  };

  // Suppliers State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierForm, setSupplierForm] = useState({ name: '', contactPerson: '', email: '', phone: '', category: '', address: '' });
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Analytics State
  const [salesReport, setSalesReport] = useState<{
    summary: SalesReportSummary;
    popularItems: PopularItemSales[];
    categoryRevenue: { [key: string]: number };
  } | null>(null);
  const [trends, setTrends] = useState<IngredientTrend[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    const reportElement = document.getElementById('sales-analytics-report');
    if (!reportElement) {
      alert('Analytics report section not found.');
      return;
    }

    setIsExportingPdf(true);
    try {
      // Pause slightly for canvas chart renders to settle
      await new Promise((resolve) => setTimeout(resolve, 350));

      const canvas = await html2canvas(reportElement, {
        scale: 2, // High resolution output
        useCORS: true,
        backgroundColor: '#0F172A',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth - 20; // 10mm left & right margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.setFillColor(15, 23, 42); // Match Dark Mode palette #0F172A
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

      let heightLeft = imgHeight;
      let position = 15;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - position);

      let pageNum = 1;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        pageNum++;
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      pdf.save(`Sales_Usage_Analysis_${todayStr}.pdf`);
    } catch (err: any) {
      console.error('PDF Export error:', err);
      alert('Failed to generate PDF report: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      api.get('/inventory/transactions').then((res) => setStockTransactions(res.transactions)).catch(console.error);
    } else if (activeTab === 'users') {
      api.get('/auth/users').then((res) => setUsers(res.users)).catch(console.error);
    } else if (activeTab === 'suppliers') {
      api.get('/suppliers').then((res) => setSuppliers(res.suppliers)).catch(console.error);
    } else if (activeTab === 'analytics') {
      api.get('/reports/sales').then(setSalesReport).catch(console.error);
      api.get('/reports/trends').then((res) => setTrends(res.trends)).catch(console.error);
    }
  }, [activeTab]);

  // Menu Handlers
  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...menuForm,
      price: parseFloat(menuForm.price),
      recipe: recipeForm.filter((r) => r.ingredientId && r.quantityRequired > 0),
    };

    try {
      if (editingMenuItem) {
        await api.put(`/menu/${editingMenuItem.id}`, payload);
      } else {
        await api.post('/menu', payload);
      }
      setIsMenuModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to save menu item');
    }
  };

  const openAddMenuModal = () => {
    setEditingMenuItem(null);
    setMenuForm({ name: '', description: '', price: '', category: 'Hot Coffee', image: '', isAvailable: true });
    setRecipeForm([]);
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image: item.image || '',
      isAvailable: item.isAvailable,
    });
    setRecipeForm(
      item.recipe ? item.recipe.map((r) => ({ ingredientId: r.ingredientId, quantityRequired: r.quantityRequired })) : []
    );
    setIsMenuModalOpen(true);
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete menu item');
    }
  };

  // Inventory Handlers
  const openAddIngredientModal = () => {
    setEditingIngredient(null);
    setIngForm({ name: '', currentStock: '1000', unit: 'g', reorderThreshold: '200', costPerUnit: '0.05' });
    setIsIngModalOpen(true);
  };

  const openEditIngredientModal = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setIngForm({
      name: ing.name,
      currentStock: ing.currentStock.toString(),
      unit: ing.unit,
      reorderThreshold: ing.reorderThreshold.toString(),
      costPerUnit: ing.costPerUnit ? ing.costPerUnit.toString() : '0',
    });
    setIsIngModalOpen(true);
  };

  const handleIngredientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: ingForm.name.trim(),
      currentStock: parseFloat(ingForm.currentStock),
      unit: ingForm.unit.trim(),
      reorderThreshold: parseFloat(ingForm.reorderThreshold),
      costPerUnit: parseFloat(ingForm.costPerUnit || '0'),
    };

    try {
      if (editingIngredient) {
        await api.put(`/inventory/${editingIngredient.id}`, payload);
      } else {
        await api.post('/inventory', payload);
      }
      setIsIngModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to save ingredient');
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ingredient? This will affect attached recipes.')) return;
    try {
      await api.delete(`/inventory/${id}`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete ingredient');
    }
  };

  const openRestockModal = (ing: Ingredient) => {
    setRestockIng(ing);
    setRestockQty('');
    setRestockType('RESTOCK');
    setRestockReason('');
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockIng || !restockQty) return;

    let qtyVal = parseFloat(restockQty);
    if (restockType === 'WASTE' && qtyVal > 0) {
      qtyVal = -qtyVal; // Deduct for waste
    }

    try {
      await api.post('/inventory/restock', {
        ingredientId: restockIng.id,
        quantityChange: qtyVal,
        type: restockType,
        reason: restockReason.trim() || `Admin ${restockType}`,
      });
      setIsRestockModalOpen(false);
      onRefreshData();
      api.get('/inventory/transactions').then((res) => setStockTransactions(res.transactions)).catch(console.error);
    } catch (err: any) {
      alert(err.message || 'Restock operation failed');
    }
  };

  // User & Supplier Handlers
  const handleUserRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u)));
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/suppliers', supplierForm);
      setSuppliers([...suppliers, res.supplier]);
      setIsSupplierModalOpen(false);
      setSupplierForm({ name: '', contactPerson: '', email: '', phone: '', category: '', address: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to add supplier');
    }
  };

  // Calculate Inventory Visuals
  const totalInventoryValue = ingredients.reduce((sum, ing) => sum + (ing.currentStock * (ing.costPerUnit || 0)), 0);
  const lowStockCount = ingredients.filter((ing) => ing.currentStock <= ing.reorderThreshold).length;
  const normalStockCount = ingredients.length - lowStockCount;

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Admin Management Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Menu editor, stock inventory control, graphical analytics & vendor directory.
          </p>
        </div>
      </div>

      {/* Admin Sub-Tabs */}
      <div className="category-bar" style={{ marginBottom: '32px' }}>
        <button className={`category-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
          ☕ Menu Manager ({menuItems.length})
        </button>
        <button className={`category-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          📦 Inventory Management ({ingredients.length})
        </button>
        <button className={`category-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          📈 Sales & Usage Analytics
        </button>
        <button className={`category-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 User Access Controls
        </button>
        <button className={`category-btn ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => setActiveTab('suppliers')}>
          🚚 Supplier Catalog
        </button>
      </div>

      {/* 1. MENU MANAGER TAB */}
      {activeTab === 'menu' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Menu Catalog & Recipe Dependencies</h2>
            <button className="btn-primary" onClick={openAddMenuModal}>
              <Plus size={18} />
              <span>Add New Menu Item</span>
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Recipe Dependencies</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.image && <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />}
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>${item.price.toFixed(2)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {item.recipe && item.recipe.length > 0 ? (
                        item.recipe.map((r) => `${r.ingredient?.name} (${r.quantityRequired}${r.ingredient?.unit})`).join(', ')
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td>
                      <span className={`stock-badge ${item.isAvailable ? 'in-stock' : 'out-of-stock'}`}>
                        {item.isAvailable ? 'Available' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => openEditMenuModal(item)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-secondary" style={{ padding: '6px', color: '#EF4444' }} onClick={() => handleDeleteMenu(item.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. INVENTORY MANAGEMENT TAB (WITH GRAPHICAL REPRESENTATIONS) */}
      {activeTab === 'inventory' && (
        <div>
          {/* Top Summary Visual Cards */}
          <div className="stats-grid" style={{ marginBottom: '28px' }}>
            <div className="stat-card">
              <div className="stat-label">Total Stock Items</div>
              <div className="stat-value">{ingredients.length} Items</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Total Asset Value</div>
              <div className="stat-value">${totalInventoryValue.toFixed(2)}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Stock Health Ratio</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981' }}>{normalStockCount} Healthy</span>
                {lowStockCount > 0 && (
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#EF4444' }}>• {lowStockCount} Low</span>
                )}
              </div>
            </div>
          </div>

          {/* INVENTORY TABLE & CRUD CONTROLS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Ingredient Master Catalog & Cost Management</h3>
            <button className="btn-primary" onClick={openAddIngredientModal}>
              <Plus size={16} />
              <span>Add New Ingredient</span>
            </button>
          </div>

          <div className="table-wrapper" style={{ marginBottom: '32px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Current Stock</th>
                  <th>Threshold</th>
                  <th>Cost / Unit</th>
                  <th>Asset Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => {
                  const isLow = ing.currentStock <= ing.reorderThreshold;
                  const val = ing.currentStock * (ing.costPerUnit || 0);
                  return (
                    <tr key={ing.id}>
                      <td style={{ fontWeight: 700 }}>{ing.name}</td>
                      <td style={{ fontWeight: 800, color: isLow ? '#EF4444' : 'var(--text-primary)' }}>
                        {ing.currentStock} {ing.unit}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {ing.reorderThreshold} {ing.unit}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        ${(ing.costPerUnit || 0).toFixed(3)} / {ing.unit}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>${val.toFixed(2)}</td>
                      <td>
                        <span className={`stock-badge ${isLow ? 'low-stock' : 'in-stock'}`}>
                          {isLow ? 'Low Stock' : 'Healthy'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => openRestockModal(ing)}>
                            Restock
                          </button>
                          <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => openEditIngredientModal(ing)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-secondary" style={{ padding: '6px', color: '#EF4444' }} onClick={() => handleDeleteIngredient(ing.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* STOCK AUDIT TRANSACTIONS LOG */}
          {stockTransactions.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Stock Audit & Transaction Log</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Ingredient</th>
                      <th>Type</th>
                      <th>Change</th>
                      <th>Reason / Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockTransactions.slice(0, 15).map((st) => (
                      <tr key={st.id}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(st.createdAt).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 600 }}>{st.ingredient?.name || 'Item'}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: st.type === 'RESTOCK' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: st.type === 'RESTOCK' ? '#10B981' : '#EF4444' }}>
                            {st.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: st.quantityChange > 0 ? '#10B981' : '#EF4444' }}>
                          {st.quantityChange > 0 ? `+${st.quantityChange}` : st.quantityChange} {st.ingredient?.unit}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{st.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. ANALYTICS & REPORTS TAB (INTERACTIVE CHART.JS GRAPHS) */}
      {activeTab === 'analytics' && salesReport && (() => {
        const catLabels = Object.keys(salesReport.categoryRevenue);
        const catValues = Object.values(salesReport.categoryRevenue);

        const categoryChartData = {
          labels: catLabels.length > 0 ? catLabels : ['Hot Coffee', 'Iced Coffee', 'Pastry'],
          datasets: [
            {
              label: 'Revenue ($)',
              data: catValues.length > 0 ? catValues : [45, 30, 25],
              backgroundColor: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#F97316'],
              borderColor: '#1E293B',
              borderWidth: 2,
            },
          ],
        };

        const popLabels = salesReport.popularItems.slice(0, 6).map((i) => i.name);
        const popCounts = salesReport.popularItems.slice(0, 6).map((i) => i.count);

        const popBarData = {
          labels: popLabels.length > 0 ? popLabels : ['Espresso', 'Iced Latte', 'Croissant'],
          datasets: [
            {
              label: 'Units Sold',
              data: popCounts.length > 0 ? popCounts : [12, 8, 5],
              backgroundColor: 'rgba(16, 185, 129, 0.75)',
              borderColor: '#10B981',
              borderWidth: 1.5,
              borderRadius: 6,
            },
          ],
        };

        const trendLabels = trends.slice(0, 6).map((t) => t.ingredient);
        const trendUsed = trends.slice(0, 6).map((t) => t.totalUsed);
        const trendWaste = trends.slice(0, 6).map((t) => t.wasteCount);

        const trendLineData = {
          labels: trendLabels.length > 0 ? trendLabels : ['Coffee Beans', 'Milk', 'Sugar'],
          datasets: [
            {
              label: 'Stock Used',
              data: trendUsed.length > 0 ? trendUsed : [450, 800, 200],
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: '#3B82F6',
              borderWidth: 2,
              borderRadius: 6,
            },
            {
              label: 'Stock Wasted',
              data: trendWaste.length > 0 ? trendWaste : [10, 0, 5],
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderColor: '#EF4444',
              borderWidth: 2,
              borderRadius: 6,
            },
          ],
        };

        const chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#94A3B8', font: { family: 'Inter', size: 12 } },
            },
          },
          scales: {
            x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
            y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          },
        };

        return (
          <div>
            {/* Header Action Bar with Prominent Export PDF Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Sales & Usage Analytics Dashboard</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Real-time sales revenue, top menu item performance & ingredient usage metrics.
                </p>
              </div>

              <button
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-glow)',
                }}
                onClick={handleExportPdf}
                disabled={isExportingPdf}
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>Generating PDF Report...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Export PDF Report</span>
                  </>
                )}
              </button>
            </div>

            {/* Capturable PDF Report Container */}
            <div id="sales-analytics-report" style={{ background: '#0F172A', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-glow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-amber)', margin: 0 }}>☕ BiiZnest</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                    Official Sales & Usage Analytics Executive Report
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div><strong>Generated:</strong> {new Date().toLocaleString()}</div>
                  <div><strong>System:</strong> Cafe Management System (CMS)</div>
                </div>
              </div>

              {/* Key Metric Summary Cards */}
              <div className="stats-grid" style={{ marginBottom: '28px' }}>
                <div className="stat-card">
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>${salesReport.summary.totalRevenue.toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Orders Placed</div>
                  <div className="stat-value">{salesReport.summary.totalOrders} Orders</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Fulfillment Success Rate</div>
                  <div className="stat-value" style={{ color: '#10B981' }}>
                    {salesReport.summary.totalOrders > 0
                      ? Math.round((salesReport.summary.completedOrders / salesReport.summary.totalOrders) * 100)
                      : 100}%
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active Kitchen Queue</div>
                  <div className="stat-value" style={{ color: '#3B82F6' }}>
                    {salesReport.summary.pendingOrders + salesReport.summary.inProgressOrders} Active
                  </div>
                </div>
              </div>

            {/* CHART ROW 1: DOUGHNUT & BAR CHARTS */}
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', marginBottom: '28px' }}>
              {/* Chart 1: Category Revenue Doughnut Chart */}
              <div className="stat-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PieChart size={20} color="var(--accent-amber)" />
                  Revenue Share by Category
                </h3>
                <div style={{ height: '260px', position: 'relative' }}>
                  <Doughnut
                    data={categoryChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { color: '#94A3B8', font: { size: 11 } } },
                        tooltip: { callbacks: { label: (ctx: any) => ` $${ctx.raw.toFixed(2)}` } },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Chart 2: Product Sales Volume Bar Chart */}
              <div className="stat-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={20} color="#10B981" />
                  Top Menu Products Sales Volume
                </h3>
                <div style={{ height: '260px' }}>
                  <Bar data={popBarData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* CHART ROW 2: INGREDIENT USAGE & WASTAGE CHART */}
            <div className="stat-card" style={{ padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="#3B82F6" />
                Raw Ingredient Consumption & Wastage Chart
              </h3>
              <div style={{ height: '280px' }}>
                <Bar data={trendLineData} options={chartOptions} />
              </div>
            </div>

            {/* ADDITIONAL DETAIL SECTION 1: EXECUTIVE FINANCIAL SUMMARY TABLE */}
            <div className="stat-card" style={{ padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-amber)' }}>
                Executive Financial & Fulfillment Summary Metrics
              </h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Financial Metric</th>
                      <th>Value / Score</th>
                      <th>Status / Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Total Gross Revenue</td>
                      <td style={{ fontWeight: 800, color: 'var(--accent-amber)' }}>${salesReport.summary.totalRevenue.toFixed(2)}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Non-cancelled store orders</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Average Order Value (AOV)</td>
                      <td style={{ fontWeight: 800, color: '#10B981' }}>
                        ${salesReport.summary.totalOrders > 0
                          ? (salesReport.summary.totalRevenue / salesReport.summary.totalOrders).toFixed(2)
                          : '0.00'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Average ticket spend per customer</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Fulfillment Success Rate</td>
                      <td style={{ fontWeight: 800, color: '#3B82F6' }}>
                        {salesReport.summary.totalOrders > 0
                          ? Math.round((salesReport.summary.completedOrders / salesReport.summary.totalOrders) * 100)
                          : 100}%
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{salesReport.summary.completedOrders} of {salesReport.summary.totalOrders} completed</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Active Kitchen Preparation Queue</td>
                      <td style={{ fontWeight: 800, color: '#F59E0B' }}>
                        {salesReport.summary.pendingOrders + salesReport.summary.inProgressOrders} Pending / Preparing
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Real-time orders in KDS</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ADDITIONAL DETAIL SECTION 2: PRODUCT SALES PERFORMANCE DATA TABLE */}
            <div className="stat-card" style={{ padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
                Top Product Performance Breakdown
              </h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Menu Product Name</th>
                      <th>Category</th>
                      <th>Units Sold</th>
                      <th>Total Revenue ($)</th>
                      <th>Revenue Share (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport.popularItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No product sales data recorded yet.</td>
                      </tr>
                    ) : (
                      salesReport.popularItems.map((item, idx) => {
                        const share = salesReport.summary.totalRevenue > 0
                          ? ((item.revenue / salesReport.summary.totalRevenue) * 100).toFixed(1)
                          : '0';

                        return (
                          <tr key={item.name}>
                            <td style={{ fontWeight: 800, color: 'var(--accent-amber)' }}>#{idx + 1}</td>
                            <td style={{ fontWeight: 700 }}>{item.name}</td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.category}</td>
                            <td style={{ fontWeight: 800 }}>{item.count} units</td>
                            <td style={{ fontWeight: 700, color: '#10B981' }}>${item.revenue.toFixed(2)}</td>
                            <td style={{ fontWeight: 700 }}>{share}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ADDITIONAL DETAIL SECTION 3: INGREDIENT USAGE AUDIT TABLE */}
            <div className="stat-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
                Raw Ingredient Consumption & Wastage Audit
              </h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Total Quantity Consumed</th>
                      <th>Stock Wasted</th>
                      <th>Current Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No ingredient usage logs recorded yet.</td>
                      </tr>
                    ) : (
                      trends.map((t) => {
                        const matchedIng = ingredients.find((i) => i.name.toLowerCase() === t.ingredient.toLowerCase());
                        const currentBal = matchedIng ? `${matchedIng.currentStock} ${matchedIng.unit}` : 'N/A';
                        const isLow = matchedIng ? matchedIng.currentStock <= matchedIng.reorderThreshold : false;

                        return (
                          <tr key={t.ingredient}>
                            <td style={{ fontWeight: 700 }}>{t.ingredient}</td>
                            <td style={{ fontWeight: 800, color: '#60A5FA' }}>{t.totalUsed} {t.unit}</td>
                            <td style={{ fontWeight: 700, color: t.wasteCount > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                              {t.wasteCount > 0 ? `${t.wasteCount} ${t.unit}` : '0'}
                            </td>
                            <td style={{ fontWeight: 700 }}>{currentBal}</td>
                            <td>
                              <span className={`stock-badge ${isLow ? 'low-stock' : 'in-stock'}`}>
                                {isLow ? 'Low Stock' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* OFFICIAL REPORT FOOTER */}
            <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <div><strong>BiiZnest - Confidential Executive Sales & Usage Analytics Report</strong></div>
              <div>Generated via Cafe Management System (CMS) Admin Portal • All rights reserved</div>
            </div>
          </div>
        </div>
      );
      })()}

      {/* 4. USER ACCESS & STAFF MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Staff & User Accounts Directory</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Admin management panel for creating Staff Barista accounts and managing system access permissions.
              </p>
            </div>
            <button className="btn-primary" onClick={() => setIsStaffModalOpen(true)}>
              <Plus size={18} />
              <span>Create Staff Account</span>
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Change Role Permission</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.role.toLowerCase()}`}>{u.role}</span>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ width: 'auto', padding: '4px 10px' }}
                        value={u.role}
                        onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="STAFF">Staff Barista</option>
                        <option value="ADMIN">Admin Manager</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SUPPLIER CATALOG TAB */}
      {activeTab === 'suppliers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Supplier & Vendor Directory</h2>
            <button className="btn-primary" onClick={() => setIsSupplierModalOpen(true)}>
              <Plus size={18} />
              <span>Add New Supplier</span>
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Contact Person</th>
                  <th>Category</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>{s.name}</td>
                    <td>{s.contactPerson}</td>
                    <td><span className="stock-badge in-stock">{s.category}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                    <td>{s.phone}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Ingredient Modal */}
      {isIngModalOpen && (
        <div className="modal-overlay" onClick={() => setIsIngModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}</h3>
              <button className="btn-close" onClick={() => setIsIngModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleIngredientSubmit}>
              <div className="form-group">
                <label className="form-label">Ingredient Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Espresso Coffee Beans"
                  value={ingForm.name}
                  onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Current Stock *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={ingForm.currentStock}
                    onChange={(e) => setIngForm({ ...ingForm, currentStock: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit of Measure *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. g, ml, units"
                    value={ingForm.unit}
                    onChange={(e) => setIngForm({ ...ingForm, unit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Reorder Threshold *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={ingForm.reorderThreshold}
                    onChange={(e) => setIngForm({ ...ingForm, reorderThreshold: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cost per Unit ($)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="0.05"
                    value={ingForm.costPerUnit}
                    onChange={(e) => setIngForm({ ...ingForm, costPerUnit: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                <Save size={18} />
                <span>Save Ingredient</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Restock & Adjustment Modal */}
      {isRestockModalOpen && restockIng && (
        <div className="modal-overlay" onClick={() => setIsRestockModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Restock / Adjust: {restockIng.name}</h3>
              <button className="btn-close" onClick={() => setIsRestockModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleRestockSubmit}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div>Current Stock: <strong>{restockIng.currentStock} {restockIng.unit}</strong></div>
                <div>Reorder Threshold: <strong>{restockIng.reorderThreshold} {restockIng.unit}</strong></div>
              </div>

              <div className="form-group">
                <label className="form-label">Operation Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className={`btn-secondary ${restockType === 'RESTOCK' ? 'active' : ''}`}
                    style={{ padding: '6px', fontSize: '0.78rem', background: restockType === 'RESTOCK' ? 'rgba(16, 185, 129, 0.2)' : undefined }}
                    onClick={() => setRestockType('RESTOCK')}
                  >
                    + Restock
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary ${restockType === 'ADJUSTMENT' ? 'active' : ''}`}
                    style={{ padding: '6px', fontSize: '0.78rem', background: restockType === 'ADJUSTMENT' ? 'rgba(59, 130, 246, 0.2)' : undefined }}
                    onClick={() => setRestockType('ADJUSTMENT')}
                  >
                    ± Adjust
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary ${restockType === 'WASTE' ? 'active' : ''}`}
                    style={{ padding: '6px', fontSize: '0.78rem', background: restockType === 'WASTE' ? 'rgba(239, 68, 68, 0.2)' : undefined, color: '#EF4444' }}
                    onClick={() => setRestockType('WASTE')}
                  >
                    - Waste
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity ({restockIng.unit}) *</label>
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

              <div className="form-group">
                <label className="form-label">Audit Reason / Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Weekly vendor shipment #402"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                <Save size={18} />
                <span>Confirm Stock Operation</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Menu Modal */}
      {isMenuModalOpen && (
        <div className="modal-overlay" onClick={() => setIsMenuModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
              <button className="btn-close" onClick={() => setIsMenuModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleMenuSubmit}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                  >
                    <option value="Hot Coffee">Hot Coffee</option>
                    <option value="Iced Coffee">Iced Coffee</option>
                    <option value="Specialty Teas">Specialty Teas</option>
                    <option value="Bakery & Pastry">Bakery & Pastry</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://..."
                  value={menuForm.image}
                  onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })}
                />
              </div>

              {/* Recipe builder */}
              <div style={{ margin: '20px 0', padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Recipe Ingredient Dependencies</label>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    onClick={() => setRecipeForm([...recipeForm, { ingredientId: ingredients[0]?.id || '', quantityRequired: 10 }])}
                  >
                    + Add Ingredient
                  </button>
                </div>

                {recipeForm.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select
                      className="form-select"
                      style={{ flex: 2 }}
                      value={item.ingredientId}
                      onChange={(e) => {
                        const copy = [...recipeForm];
                        copy[idx].ingredientId = e.target.value;
                        setRecipeForm(copy);
                      }}
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="Qty req."
                      value={item.quantityRequired}
                      onChange={(e) => {
                        const copy = [...recipeForm];
                        copy[idx].quantityRequired = parseFloat(e.target.value) || 0;
                        setRecipeForm(copy);
                      }}
                    />

                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                      onClick={() => setRecipeForm(recipeForm.filter((_, i) => i !== idx))}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                <Save size={18} />
                <span>Save Menu Item</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSupplierModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Supplier</h3>
              <button className="btn-close" onClick={() => setIsSupplierModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSupplierSubmit}>
              <div className="form-group">
                <label className="form-label">Vendor Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  type="text"
                  className="form-input"
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                Save Supplier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Staff Account Modal */}
      {isStaffModalOpen && (
        <div className="modal-overlay" onClick={() => setIsStaffModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Staff Account</h3>
              <button className="btn-close" onClick={() => setIsStaffModalOpen(false)}>✕</button>
            </div>
            {staffError && (
              <div className="alert-banner" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#FCA5A5', marginBottom: '16px' }}>
                <span>{staffError}</span>
              </div>
            )}
            <form onSubmit={handleCreateStaffSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Barista"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. staff@biiznest.com"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Account Role</label>
                <input
                  type="text"
                  className="form-input"
                  value="STAFF (Kitchen & Barista Staff)"
                  disabled
                  style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--accent-amber)', fontWeight: 700 }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={isCreatingStaff}>
                {isCreatingStaff ? 'Creating Staff Account...' : 'Create Staff Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
