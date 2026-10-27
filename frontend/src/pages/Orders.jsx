import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  Trash2, 
  X, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../services/api';

export default function Orders({ showToast, setActiveTab }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New Order Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    payment_status: 'Paid'
  });
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1 }
  ]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const [ordersData, prodsData] = await Promise.all([
        api.getOrders(statusFilter),
        api.getProducts()
      ]);
      setOrders(ordersData);
      setProducts(prodsData);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleOpenAdd = () => {
    setCustomerInfo({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      shipping_address: '',
      payment_status: 'Paid'
    });
    setOrderItems([
      { product_id: products.length > 0 ? products[0].id : '', quantity: 1 }
    ]);
    setIsAddModalOpen(true);
  };

  const addItemRow = () => {
    setOrderItems([...orderItems, { product_id: products.length > 0 ? products[0].id : '', quantity: 1 }]);
  };

  const removeItemRow = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItemRow = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  // Compute live estimated total
  const calculatedTotal = orderItems.reduce((acc, item) => {
    const prod = products.find(p => p.id === parseInt(item.product_id, 10));
    if (!prod) return acc;
    return acc + (prod.unit_price * (parseInt(item.quantity, 10) || 0));
  }, 0);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...customerInfo,
        items: orderItems.map(it => ({
          product_id: parseInt(it.product_id, 10),
          quantity: parseInt(it.quantity, 10)
        }))
      };

      const res = await api.createOrder(payload);
      showToast(`Order #${res.order_number} created successfully! Inventory deducted.`, 'success');
      setIsAddModalOpen(false);
      loadOrders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      showToast(`Order status updated to '${newStatus}'`, 'success');
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id, orderNumber) => {
    if (!window.confirm(`Delete order '${orderNumber}'?`)) return;
    try {
      await api.deleteOrder(id);
      showToast('Order deleted.', 'success');
      loadOrders();
      if (selectedOrder?.id === id) setSelectedOrder(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <div className="page-header-text">
          <h3>Customer Order Management</h3>
          <p>Process inbound orders, verify stock allocations, and track lifecycle states</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} />
          <span>New Customer Order</span>
        </button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--gray-500)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Filter by status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>Loading customer orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No orders found for selected filter.</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items Count</th>
                <th>Total Value</th>
                <th>Payment</th>
                <th>Order Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <code style={{ fontWeight: 600 }}>{o.order_number}</code>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{o.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{o.customer_email}</div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {o.items.reduce((acc, i) => acc + i.quantity, 0)} units ({o.items.length} items)
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{o.total_amount.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`badge ${o.payment_status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--gray-300)',
                        backgroundColor: 
                          o.status === 'Delivered' ? 'var(--success-light)' :
                          o.status === 'Shipped' ? 'var(--primary-light)' :
                          o.status === 'Processing' ? 'var(--warning-light)' : 
                          o.status === 'Cancelled' ? 'var(--danger-light)' : '#f8fafc',
                        color:
                          o.status === 'Delivered' ? 'var(--success-text)' :
                          o.status === 'Shipped' ? 'var(--primary)' :
                          o.status === 'Processing' ? 'var(--warning-text)' :
                          o.status === 'Cancelled' ? 'var(--danger-text)' : 'inherit',
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    {new Date(o.order_date).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => setSelectedOrder(o)}
                        className="btn btn-secondary btn-sm"
                        title="View Order Details"
                      >
                        <Eye size={13} />
                      </button>
                      <button 
                        onClick={() => handleDelete(o.id, o.order_number)}
                        className="btn btn-danger btn-sm"
                        title="Delete Order"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Order Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Customer Order"
        maxWidth="680px"
      >
        <form onSubmit={handleCreateOrder}>
          <div className="form-row">
            <div className="form-group">
              <label>Customer Name *</label>
              <input 
                type="text" 
                required 
                className="form-control" 
                value={customerInfo.customer_name} 
                onChange={(e) => setCustomerInfo({...customerInfo, customer_name: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Customer Email *</label>
              <input 
                type="email" 
                required 
                className="form-control" 
                value={customerInfo.customer_email} 
                onChange={(e) => setCustomerInfo({...customerInfo, customer_email: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Customer Phone</label>
              <input 
                type="text" 
                className="form-control" 
                value={customerInfo.customer_phone} 
                onChange={(e) => setCustomerInfo({...customerInfo, customer_phone: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Payment Status</label>
              <select 
                className="form-control"
                value={customerInfo.payment_status}
                onChange={(e) => setCustomerInfo({...customerInfo, payment_status: e.target.value})}
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Payment Pending</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Shipping Address *</label>
            <textarea 
              rows="2" 
              required 
              className="form-control" 
              value={customerInfo.shipping_address} 
              onChange={(e) => setCustomerInfo({...customerInfo, shipping_address: e.target.value})} 
            />
          </div>

          <div style={{ marginTop: '20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Order Line Items</label>
            <button type="button" onClick={addItemRow} className="btn btn-secondary btn-sm">
              <Plus size={13} />
              <span>Add Item</span>
            </button>
          </div>

          {orderItems.map((item, idx) => {
            const selectedProd = products.find(p => p.id === parseInt(item.product_id, 10));
            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <select 
                    className="form-control"
                    value={item.product_id}
                    onChange={(e) => updateItemRow(idx, 'product_id', e.target.value)}
                    required
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.quantity_in_stock} | ₹{p.unit_price})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input 
                    type="number" 
                    min="1" 
                    max={selectedProd ? selectedProd.quantity_in_stock : 9999}
                    required 
                    placeholder="Qty"
                    className="form-control" 
                    value={item.quantity} 
                    onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)} 
                  />
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                  ₹{selectedProd ? (selectedProd.unit_price * (parseInt(item.quantity, 10) || 0)).toFixed(2) : '0.00'}
                </div>
                <div>
                  <button 
                    type="button" 
                    onClick={() => removeItemRow(idx)}
                    disabled={orderItems.length === 1}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '6px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          <div style={{ textAlign: 'right', marginTop: '16px', fontSize: '1.1rem', fontWeight: 700 }}>
            Estimated Total: <span style={{ color: 'var(--primary)' }}>₹{calculatedTotal.toFixed(2)}</span>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm & Place Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details: ${selectedOrder?.order_number}`}
        maxWidth="620px"
      >
        {selectedOrder && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px', background: 'var(--gray-50)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Customer Name</div>
                <div style={{ fontWeight: 600 }}>{selectedOrder.customer_name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)' }}>{selectedOrder.customer_email}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)' }}>{selectedOrder.customer_phone || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Shipping Destination</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-800)' }}>{selectedOrder.shipping_address}</div>
                <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--gray-500)' }}>Order Date</div>
                <div style={{ fontSize: '0.85rem' }}>{new Date(selectedOrder.order_date).toLocaleString()}</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.92rem', marginBottom: '10px' }}>Ordered Items</h4>
            <table className="custom-table" style={{ marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((it) => (
                  <tr key={it.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{it.product_name}</div>
                      <code style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{it.product_sku}</code>
                    </td>
                    <td>₹{it.unit_price.toFixed(2)}</td>
                    <td>{it.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{it.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--gray-200)', paddingTop: '16px' }}>
              <div>
                Status: <span className="badge badge-primary">{selectedOrder.status}</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Total: <span style={{ color: 'var(--primary)' }}>₹{selectedOrder.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '16px 0 0 0' }}>
              <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
