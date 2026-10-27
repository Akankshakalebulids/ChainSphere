const API_BASE = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.detail || JSON.stringify(errData);
    } catch (e) {
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Health
  getHealth: () => fetch(`${API_BASE}/health`).then(handleResponse),

  // Dashboard
  getDashboardMetrics: () => fetch(`${API_BASE}/dashboard/metrics`).then(handleResponse),

  // Products & Inventory
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.lowStockOnly) query.append('low_stock_only', 'true');
    return fetch(`${API_BASE}/products/?${query.toString()}`).then(handleResponse);
  },
  getLowStockProducts: () => fetch(`${API_BASE}/products/low-stock`).then(handleResponse),
  createProduct: (data) => fetch(`${API_BASE}/products/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateProduct: (id, data) => fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  adjustStock: (id, adjustment, reason) => fetch(`${API_BASE}/products/${id}/stock-adjustment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adjustment, reason })
  }).then(handleResponse),
  deleteProduct: (id) => fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Suppliers
  getSuppliers: (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetch(`${API_BASE}/suppliers/${query}`).then(handleResponse);
  },
  createSupplier: (data) => fetch(`${API_BASE}/suppliers/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateSupplier: (id, data) => fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteSupplier: (id) => fetch(`${API_BASE}/suppliers/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Orders
  getOrders: (status = '') => {
    const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
    return fetch(`${API_BASE}/orders/${query}`).then(handleResponse);
  },
  createOrder: (data) => fetch(`${API_BASE}/orders/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateOrderStatus: (id, status) => fetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).then(handleResponse),
  deleteOrder: (id) => fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Shipments
  getShipments: (status = '') => {
    const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
    return fetch(`${API_BASE}/shipments/${query}`).then(handleResponse);
  },
  trackShipment: (trackingNumber) => fetch(`${API_BASE}/shipments/track/${trackingNumber}`).then(handleResponse),
  createShipment: (data) => fetch(`${API_BASE}/shipments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateShipmentStatus: (id, status, currentLocation, notes) => fetch(`${API_BASE}/shipments/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, current_location: currentLocation, notes })
  }).then(handleResponse),
  deleteShipment: (id) => fetch(`${API_BASE}/shipments/${id}`, { method: 'DELETE' }).then(handleResponse),
};
