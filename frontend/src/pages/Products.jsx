import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../services/api';

export default function Products({ showToast }) {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [adjustment, setAdjustment] = useState(10);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Electronics',
    description: '',
    unit_price: '',
    cost_price: '',
    quantity_in_stock: '',
    reorder_threshold: '10',
    warehouse_location: 'Aisle 1, Bay A',
    supplier_id: ''
  });

  const categories = ['All', 'Electronics', 'Power Systems', 'Sensors', 'Packaging', 'Hardware'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, suppData] = await Promise.all([
        api.getProducts({ search, category, lowStockOnly }),
        api.getSuppliers()
      ]);
      setProducts(prodData);
      setSuppliers(suppData);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category, lowStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAdd = () => {
    setFormData({
      sku: `PRD-${Date.now().toString().slice(-4)}`,
      name: '',
      category: 'Electronics',
      description: '',
      unit_price: '',
      cost_price: '',
      quantity_in_stock: '',
      reorder_threshold: '10',
      warehouse_location: 'Aisle 1, Bay A',
      supplier_id: suppliers.length > 0 ? suppliers[0].id : ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      description: p.description || '',
      unit_price: p.unit_price,
      cost_price: p.cost_price || '',
      quantity_in_stock: p.quantity_in_stock,
      reorder_threshold: p.reorder_threshold,
      warehouse_location: p.warehouse_location || '',
      supplier_id: p.supplier_id || ''
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        unit_price: parseFloat(formData.unit_price),
        cost_price: parseFloat(formData.cost_price || 0),
        quantity_in_stock: parseInt(formData.quantity_in_stock, 10),
        reorder_threshold: parseInt(formData.reorder_threshold, 10),
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id, 10) : null
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        showToast(`Product '${payload.name}' updated!`, 'success');
        setEditingProduct(null);
      } else {
        await api.createProduct(payload);
        showToast(`Product '${payload.name}' created!`, 'success');
        setIsAddModalOpen(false);
      }
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!stockModalProduct) return;
    try {
      await api.adjustStock(stockModalProduct.id, Number(adjustment), 'Manual Inventory Adjustment');
      showToast(`Stock updated for ${stockModalProduct.name}!`, 'success');
      setStockModalProduct(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete '${name}'?`)) return;
    try {
      await api.deleteProduct(id);
      showToast(`Product deleted.`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <div className="page-header-text">
          <h3>Product & Inventory Management</h3>
          <p>Track warehouse stock, threshold limits, SKUs, and supplier associations</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <form onSubmit={handleSearchSubmit} className="search-input-box">
            <Search size={16} color="var(--gray-400)" />
            <input 
              type="text" 
              placeholder="Search by SKU, product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="var(--gray-500)" />
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="form-control"
                style={{ padding: '6px 12px', width: 'auto' }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={lowStockOnly} 
                onChange={(e) => setLowStockOnly(e.target.checked)} 
              />
              <span style={{ color: lowStockOnly ? 'var(--danger-text)' : 'inherit', fontWeight: lowStockOnly ? 600 : 400 }}>
                Low Stock Only
              </span>
            </label>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>Loading catalog...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No products match the filter criteria.</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product & SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Level</th>
                <th>Threshold</th>
                <th>Warehouse</th>
                <th>Supplier</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLow = p.quantity_in_stock <= p.reorder_threshold;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <code style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{p.sku}</code>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{p.category}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>₹{p.unit_price.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                        {p.quantity_in_stock} in stock
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                      {p.reorder_threshold} units
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{p.warehouse_location || '—'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.supplier_name || 'None'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => { setStockModalProduct(p); setAdjustment(10); }}
                          className="btn btn-secondary btn-sm"
                          title="Quick Restock / Stock Adjustment"
                        >
                          <ArrowUpDown size={13} />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(p)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Product"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id, p.name)}
                          className="btn btn-danger btn-sm"
                          title="Delete Product"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen || Boolean(editingProduct)}
        onClose={() => { setIsAddModalOpen(false); setEditingProduct(null); }}
        title={editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Add New Catalog Product'}
        maxWidth="620px"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>SKU (Stock Keeping Unit) *</label>
              <input 
                type="text" 
                required 
                className="form-control" 
                value={formData.sku} 
                onChange={(e) => setFormData({...formData, sku: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select 
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Product Name *</label>
            <input 
              type="text" 
              required 
              className="form-control" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              rows="2" 
              className="form-control" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Selling Unit Price (₹) *</label>
              <input 
                type="number" 
                step="0.01" 
                required 
                className="form-control" 
                value={formData.unit_price} 
                onChange={(e) => setFormData({...formData, unit_price: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Cost Price (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-control" 
                value={formData.cost_price} 
                onChange={(e) => setFormData({...formData, cost_price: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity in Stock *</label>
              <input 
                type="number" 
                required 
                className="form-control" 
                value={formData.quantity_in_stock} 
                onChange={(e) => setFormData({...formData, quantity_in_stock: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Reorder Alert Threshold *</label>
              <input 
                type="number" 
                required 
                className="form-control" 
                value={formData.reorder_threshold} 
                onChange={(e) => setFormData({...formData, reorder_threshold: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Warehouse Location</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.warehouse_location} 
                onChange={(e) => setFormData({...formData, warehouse_location: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Primary Supplier</label>
              <select 
                className="form-control"
                value={formData.supplier_id}
                onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
              >
                <option value="">None</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Stock Adjustment Modal */}
      <Modal
        isOpen={Boolean(stockModalProduct)}
        onClose={() => setStockModalProduct(null)}
        title={`Adjust Inventory Stock: ${stockModalProduct?.name}`}
      >
        <form onSubmit={handleStockAdjustment}>
          <div style={{ marginBottom: '16px', fontSize: '0.88rem' }}>
            Current stock in warehouse: <strong>{stockModalProduct?.quantity_in_stock} units</strong>
          </div>
          <div className="form-group">
            <label>Stock Adjustment Quantity (+ to restock, - to deduct)</label>
            <input 
              type="number" 
              required 
              className="form-control" 
              value={adjustment} 
              onChange={(e) => setAdjustment(e.target.value)} 
            />
            <small style={{ color: 'var(--gray-500)', marginTop: '4px', display: 'block' }}>
              Example: Enter <code>50</code> to restock 50 units, or <code>-5</code> to record damaged units.
            </small>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setStockModalProduct(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Apply Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
