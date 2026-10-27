import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  Truck, 
  IndianRupee, 
  TrendingUp, 
  ArrowRight,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import { api } from '../services/api';

export default function Dashboard({ setActiveTab, showToast }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockAmount, setRestockAmount] = useState(25);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      showToast('Error loading dashboard statistics: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleQuickRestock = async (e) => {
    e.preventDefault();
    if (!restockProduct) return;
    try {
      await api.adjustStock(restockProduct.id, Number(restockAmount), 'Dashboard Quick Restock');
      showToast(`Restocked ${restockAmount} units of ${restockProduct.name}`, 'success');
      setRestockProduct(null);
      fetchMetrics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading && !metrics) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>Loading SmartChain metrics...</div>;
  }

  const m = metrics || {
    total_products: 0,
    total_inventory_valuation: 0,
    total_orders: 0,
    total_revenue: 0,
    low_stock_count: 0,
    active_shipments_count: 0,
    category_distribution: [],
    order_status_distribution: [],
    urgent_low_stock: [],
    recent_orders: [],
    recent_shipments: []
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="page-header-text">
          <h3>Executive SCM Overview</h3>
          <p>Real-time metrics across inventory, supplier orders, shipments, and threshold alerts</p>
        </div>
        <div>
          <button onClick={() => setActiveTab('orders')} className="btn btn-primary btn-sm">
            <ShoppingCart size={15} />
            <span>New Customer Order</span>
          </button>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="stats-grid">
        <StatCard 
          title="Total Products" 
          value={m.total_products} 
          icon={Package} 
          color="#2563eb" 
          bgColor="#eff6ff"
          subtitle="Catalog SKUs tracked"
        />
        <StatCard 
          title="Inventory Valuation" 
          value={`₹${m.total_inventory_valuation.toLocaleString('en-IN')}`} 
          icon={IndianRupee} 
          color="#059669" 
          bgColor="#ecfdf5"
          subtitle="Asset holding value"
        />
        <StatCard 
          title="Total Revenue" 
          value={`₹${m.total_revenue.toLocaleString('en-IN')}`} 
          icon={TrendingUp} 
          color="#7c3aed" 
          bgColor="#f5f3ff"
          subtitle="Fulfilled & active orders"
        />
        <StatCard 
          title="Total Orders" 
          value={m.total_orders} 
          icon={ShoppingCart} 
          color="#0284c7" 
          bgColor="#e0f2fe"
          subtitle="Cumulative orders"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={m.low_stock_count} 
          icon={AlertTriangle} 
          color={m.low_stock_count > 0 ? "#dc2626" : "#10b981"} 
          bgColor={m.low_stock_count > 0 ? "#fef2f2" : "#ecfdf5"}
          subtitle={m.low_stock_count > 0 ? "Requires restock" : "Optimal levels"}
        />
        <StatCard 
          title="Active Shipments" 
          value={m.active_shipments_count} 
          icon={Truck} 
          color="#d97706" 
          bgColor="#fffbeb"
          subtitle="In-transit or out for delivery"
        />
      </div>

      {/* Row 2: Category Breakdown & Urgent Low Stock */}
      <div className="dashboard-grid-2">
        {/* Urgent Low Stock Alerts */}
        <div className="table-container">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--danger)" />
              <strong style={{ fontSize: '0.95rem' }}>Urgent Low Stock Warnings</strong>
            </div>
            <button onClick={() => setActiveTab('alerts')} className="btn btn-secondary btn-sm">
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {m.urgent_low_stock.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--success-text)' }}>
              All inventory levels are currently above reorder thresholds.
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product / SKU</th>
                  <th>In Stock</th>
                  <th>Threshold</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {m.urgent_low_stock.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <code style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{item.sku}</code>
                    </td>
                    <td>
                      <span className="badge badge-danger">
                        {item.quantity_in_stock} units left
                      </span>
                    </td>
                    <td>{item.reorder_threshold} units</td>
                    <td>
                      <button 
                        onClick={() => { setRestockProduct(item); setRestockAmount(25); }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        <PlusCircle size={13} />
                        <span>Restock</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="table-container" style={{ padding: '20px' }}>
          <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '16px' }}>
            Inventory by Category
          </strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {m.category_distribution.map((cat) => {
              const totalStockAll = m.category_distribution.reduce((acc, c) => acc + c.total_stock, 0) || 1;
              const percentage = Math.round((cat.total_stock / totalStockAll) * 100);
              return (
                <div key={cat.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500 }}>{cat.category}</span>
                    <span style={{ color: 'var(--gray-500)' }}>{cat.total_stock} units ({cat.product_count} SKUs)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--gray-200)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        backgroundColor: 'var(--primary)',
                        borderRadius: '4px' 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Customer Orders & Active Shipments */}
      <div className="dashboard-grid-2">
        {/* Recent Orders */}
        <div className="table-container">
          <div className="table-toolbar">
            <strong style={{ fontSize: '0.95rem' }}>Recent Customer Orders</strong>
            <button onClick={() => setActiveTab('orders')} className="btn btn-secondary btn-sm">
              <span>All Orders</span>
              <ArrowRight size={14} />
            </button>
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {m.recent_orders.map((ord) => (
                <tr key={ord.id}>
                  <td>
                    <code style={{ fontWeight: 600 }}>{ord.order_number}</code>
                  </td>
                  <td>{ord.customer_name}</td>
                  <td>₹{ord.total_amount.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`badge ${
                      ord.status === 'Delivered' ? 'badge-success' : 
                      ord.status === 'Shipped' ? 'badge-primary' :
                      ord.status === 'Processing' ? 'badge-warning' : 'badge-neutral'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Shipments */}
        <div className="table-container">
          <div className="table-toolbar">
            <strong style={{ fontSize: '0.95rem' }}>Live Shipment Tracker</strong>
            <button onClick={() => setActiveTab('shipments')} className="btn btn-secondary btn-sm">
              <span>Track All</span>
              <ArrowRight size={14} />
            </button>
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Carrier</th>
                <th>Checkpoint</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {m.recent_shipments.map((s) => (
                <tr key={s.id}>
                  <td>
                    <code style={{ fontSize: '0.78rem' }}>{s.tracking_number}</code>
                  </td>
                  <td>{s.carrier}</td>
                  <td style={{ fontSize: '0.8rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.current_location}
                  </td>
                  <td>
                    <span className={`badge ${
                      s.status === 'Delivered' ? 'badge-success' : 'badge-primary'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Restock Modal */}
      <Modal
        isOpen={Boolean(restockProduct)}
        onClose={() => setRestockProduct(null)}
        title={`Quick Restock: ${restockProduct?.name}`}
      >
        <form onSubmit={handleQuickRestock}>
          <div style={{ marginBottom: '16px', fontSize: '0.88rem', color: 'var(--gray-600)' }}>
            Current Stock: <strong>{restockProduct?.quantity_in_stock}</strong> units | 
            Minimum Threshold: <strong>{restockProduct?.reorder_threshold}</strong> units
          </div>
          <div className="form-group">
            <label>Units to Add to Inventory</label>
            <input 
              type="number"
              min="1"
              max="5000"
              required
              className="form-control"
              value={restockAmount}
              onChange={(e) => setRestockAmount(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setRestockProduct(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Restock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
