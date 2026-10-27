import React, { useState, useEffect } from 'react';
import { AlertTriangle, PlusCircle, CheckCircle2, PackageCheck, Phone, Mail, ArrowRight } from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../services/api';

export default function Alerts({ showToast, onInventoryChange }) {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockAmount, setRestockAmount] = useState(25);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getLowStockProducts();
      setLowStockItems(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.adjustStock(selectedProduct.id, Number(restockAmount), 'Threshold Alert Restock');
      showToast(`Restocked ${restockAmount} units of ${selectedProduct.name}!`, 'success');
      setSelectedProduct(null);
      loadAlerts();
      if (onInventoryChange) onInventoryChange();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleQuickAdd = async (product, amount) => {
    try {
      await api.adjustStock(product.id, amount, 'One-Click Quick Restock');
      showToast(`Added ${amount} units to ${product.name}!`, 'success');
      loadAlerts();
      if (onInventoryChange) onInventoryChange();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="alerts-page">
      <div className="page-header">
        <div className="page-header-text">
          <h3>Automated Low-Stock Alert Center</h3>
          <p>Real-time monitor tracking SKUs falling below minimum safety threshold limits</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>Scanning inventory thresholds...</div>
      ) : lowStockItems.length === 0 ? (
        <div className="table-container" style={{ padding: '48px', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 16px auto' }} />
          <h4 style={{ fontSize: '1.2rem', color: 'var(--gray-900)' }}>Warehouse Inventory Healthy</h4>
          <p style={{ color: 'var(--gray-500)', marginTop: '6px' }}>All catalog items currently satisfy their required minimum stock thresholds.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="#dc2626" />
            <div>
              <strong style={{ color: '#991b1b', fontSize: '0.95rem' }}>
                Action Required: {lowStockItems.length} Products Below Safety Threshold
              </strong>
              <div style={{ fontSize: '0.82rem', color: '#b91c1c', marginTop: '2px' }}>
                Initiate purchase orders with suppliers immediately to prevent supply chain fulfillment delays.
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product / SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Minimum Threshold</th>
                  <th>Suggested Reorder</th>
                  <th>Supplier</th>
                  <th style={{ textAlign: 'right' }}>Quick Restock</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => {
                  const deficit = Math.max(0, (item.reorder_threshold * 2) - item.quantity_in_stock);
                  const isCritical = item.quantity_in_stock <= Math.floor(item.reorder_threshold / 2);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <code style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{item.sku}</code>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{item.category}</span>
                      </td>
                      <td>
                        <span className={`badge ${isCritical ? 'badge-danger' : 'badge-warning'}`}>
                          {item.quantity_in_stock} in stock
                        </span>
                      </td>
                      <td style={{ color: 'var(--gray-600)' }}>
                        {item.reorder_threshold} units
                      </td>
                      <td>
                        <strong style={{ color: 'var(--primary)' }}>+{deficit} units</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{item.supplier_name || 'No Supplier Assigned'}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleQuickAdd(item, 25)}
                            className="btn btn-secondary btn-sm"
                            title="Add +25 units instantly"
                          >
                            +25
                          </button>
                          <button 
                            onClick={() => handleQuickAdd(item, 50)}
                            className="btn btn-secondary btn-sm"
                            title="Add +50 units instantly"
                          >
                            +50
                          </button>
                          <button 
                            onClick={() => { setSelectedProduct(item); setRestockAmount(deficit || 20); }}
                            className="btn btn-primary btn-sm"
                          >
                            Custom
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Restock Modal */}
      <Modal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={`Restock Product: ${selectedProduct?.name}`}
      >
        <form onSubmit={handleRestock}>
          <div style={{ marginBottom: '14px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
            Warehouse Location: <strong>{selectedProduct?.warehouse_location}</strong> | Current: <strong>{selectedProduct?.quantity_in_stock}</strong>
          </div>
          <div className="form-group">
            <label>Quantity to Replenish</label>
            <input 
              type="number"
              min="1"
              required
              className="form-control"
              value={restockAmount}
              onChange={(e) => setRestockAmount(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setSelectedProduct(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Execute Restock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
