import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  Plus, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Edit3, 
  Trash2,
  Navigation
} from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../services/api';

export default function Shipments({ showToast }) {
  const [shipments, setShipments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Tracking Search
  const [trackingSearch, setTrackingSearch] = useState('');
  const [trackedShipment, setTrackedShipment] = useState(null);

  // Modals
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);

  const [dispatchData, setDispatchData] = useState({
    order_id: '',
    carrier: 'BlueDart Express',
    origin: 'Central Logistics Park, Bhiwandi',
    destination: '',
    current_location: 'Central Dispatch Desk, Hub 1',
    status: 'In Transit',
    notes: 'Dispatched via express road transport'
  });

  const [statusUpdateData, setStatusUpdateData] = useState({
    status: 'Out for Delivery',
    current_location: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [shipData, orderData] = await Promise.all([
        api.getShipments(statusFilter),
        api.getOrders()
      ]);
      setShipments(shipData);
      setOrders(orderData);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenDispatch = () => {
    const eligibleOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Processing');
    const firstOrder = eligibleOrders.length > 0 ? eligibleOrders[0] : null;

    setDispatchData({
      order_id: firstOrder ? firstOrder.id : '',
      carrier: 'BlueDart Express',
      origin: 'Central Logistics Park, Bhiwandi',
      destination: firstOrder ? firstOrder.shipping_address : '',
      current_location: 'Central Dispatch Desk, Hub 1',
      status: 'In Transit',
      notes: 'Dispatched via express road transport'
    });
    setIsDispatchModalOpen(true);
  };

  const handleOrderSelect = (orderId) => {
    const ord = orders.find(o => o.id === parseInt(orderId, 10));
    setDispatchData({
      ...dispatchData,
      order_id: orderId,
      destination: ord ? ord.shipping_address : ''
    });
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...dispatchData,
        order_id: parseInt(dispatchData.order_id, 10)
      };
      const res = await api.createShipment(payload);
      showToast(`Shipment ${res.tracking_number} dispatched! Order marked as Shipped.`, 'success');
      setIsDispatchModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenStatusEdit = (s) => {
    setEditingShipment(s);
    setStatusUpdateData({
      status: s.status,
      current_location: s.current_location,
      notes: s.notes || ''
    });
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!editingShipment) return;
    try {
      await api.updateShipmentStatus(
        editingShipment.id,
        statusUpdateData.status,
        statusUpdateData.current_location,
        statusUpdateData.notes
      );
      showToast(`Shipment ${editingShipment.tracking_number} updated to ${statusUpdateData.status}!`, 'success');
      setEditingShipment(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleTrackingLookup = async (e) => {
    e.preventDefault();
    if (!trackingSearch.trim()) return;
    try {
      const result = await api.trackShipment(trackingSearch.trim());
      setTrackedShipment(result);
    } catch (err) {
      showToast(`Tracking lookup failed: ${err.message}`, 'error');
      setTrackedShipment(null);
    }
  };

  const handleDelete = async (id, trackingNumber) => {
    if (!window.confirm(`Delete shipment record '${trackingNumber}'?`)) return;
    try {
      await api.deleteShipment(id);
      showToast('Shipment record deleted.', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="shipments-page">
      <div className="page-header">
        <div className="page-header-text">
          <h3>Shipment Tracking & Logistics</h3>
          <p>Real-time delivery progress, carrier management, and waypoint tracking</p>
        </div>
        <button onClick={handleOpenDispatch} className="btn btn-primary">
          <Truck size={16} />
          <span>Dispatch New Shipment</span>
        </button>
      </div>

      {/* Live Tracking Number Lookup Bar */}
      <div className="table-container" style={{ padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleTrackingLookup} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }} className="search-input-box">
            <Search size={16} color="var(--gray-400)" />
            <input 
              type="text" 
              placeholder="Enter Tracking Number (e.g., TRK-SC-98214A1)..."
              value={trackingSearch}
              onChange={(e) => setTrackingSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <Navigation size={15} />
            <span>Track Live</span>
          </button>
          {trackedShipment && (
            <button 
              type="button" 
              onClick={() => { setTrackedShipment(null); setTrackingSearch(''); }} 
              className="btn btn-secondary"
            >
              Clear
            </button>
          )}
        </form>

        {trackedShipment && (
          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>LIVE SHIPMENT RESULT</span>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{trackedShipment.tracking_number}</h4>
              </div>
              <span className={`badge ${trackedShipment.status === 'Delivered' ? 'badge-success' : 'badge-primary'}`}>
                {trackedShipment.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', fontSize: '0.85rem' }}>
              <div>
                <strong>Carrier:</strong> <div>{trackedShipment.carrier}</div>
              </div>
              <div>
                <strong>Current Checkpoint:</strong> <div>{trackedShipment.current_location}</div>
              </div>
              <div>
                <strong>Destination:</strong> <div style={{ fontSize: '0.8rem' }}>{trackedShipment.destination}</div>
              </div>
              <div>
                <strong>Dispatched Date:</strong> <div>{new Date(trackedShipment.dispatched_at).toLocaleDateString()}</div>
              </div>
            </div>
            {trackedShipment.notes && (
              <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                <em>Notes: {trackedShipment.notes}</em>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shipments Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Filter by status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="All">All Statuses</option>
              <option value="In Transit">In Transit</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>Loading shipments...</div>
        ) : shipments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No shipments found.</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Tracking Number</th>
                <th>Order Ref</th>
                <th>Carrier</th>
                <th>Origin &rarr; Destination</th>
                <th>Current Waypoint</th>
                <th>Delivery Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id}>
                  <td>
                    <code style={{ fontWeight: 600, color: 'var(--primary)' }}>{s.tracking_number}</code>
                  </td>
                  <td>
                    <code>{s.order_number || `Order #${s.order_id}`}</code>
                  </td>
                  <td style={{ fontWeight: 500 }}>{s.carrier}</td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>From: {s.origin}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>To: {s.destination}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                      <MapPin size={13} color="var(--primary)" />
                      <span>{s.current_location}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      s.status === 'Delivered' ? 'badge-success' : 
                      s.status === 'Out for Delivery' ? 'badge-warning' : 'badge-primary'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleOpenStatusEdit(s)}
                        className="btn btn-secondary btn-sm"
                        title="Update Waypoint / Status"
                      >
                        <Edit3 size={13} />
                        <span>Update</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id, s.tracking_number)}
                        className="btn btn-danger btn-sm"
                        title="Delete Record"
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

      {/* Dispatch Shipment Modal */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Dispatch Shipment for Order"
        maxWidth="600px"
      >
        <form onSubmit={handleDispatchSubmit}>
          <div className="form-group">
            <label>Select Customer Order *</label>
            <select
              required
              className="form-control"
              value={dispatchData.order_id}
              onChange={(e) => handleOrderSelect(e.target.value)}
            >
              <option value="">-- Choose Order to Dispatch --</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.order_number} — {o.customer_name} (₹{o.total_amount} | {o.status})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Logistics Carrier *</label>
              <select
                className="form-control"
                value={dispatchData.carrier}
                onChange={(e) => setDispatchData({...dispatchData, carrier: e.target.value})}
              >
                <option value="BlueDart Express">BlueDart Express</option>
                <option value="FedEx Supply Chain">FedEx Supply Chain</option>
                <option value="DHL Global Forwarding">DHL Global Forwarding</option>
                <option value="Delhivery Logistics">Delhivery Logistics</option>
              </select>
            </div>
            <div className="form-group">
              <label>Initial Status</label>
              <select
                className="form-control"
                value={dispatchData.status}
                onChange={(e) => setDispatchData({...dispatchData, status: e.target.value})}
              >
                <option value="In Transit">In Transit</option>
                <option value="Out for Delivery">Out for Delivery</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Origin Distribution Hub</label>
            <input 
              type="text" 
              className="form-control" 
              value={dispatchData.origin} 
              onChange={(e) => setDispatchData({...dispatchData, origin: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label>Destination Address *</label>
            <input 
              type="text" 
              required 
              className="form-control" 
              value={dispatchData.destination} 
              onChange={(e) => setDispatchData({...dispatchData, destination: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label>Current Location / Checkpoint</label>
            <input 
              type="text" 
              className="form-control" 
              value={dispatchData.current_location} 
              onChange={(e) => setDispatchData({...dispatchData, current_location: e.target.value})} 
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsDispatchModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Generate Tracking & Dispatch
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Checkpoint / Status Modal */}
      <Modal
        isOpen={Boolean(editingShipment)}
        onClose={() => setEditingShipment(null)}
        title={`Update Shipment: ${editingShipment?.tracking_number}`}
        maxWidth="540px"
      >
        <form onSubmit={handleStatusSubmit}>
          <div className="form-group">
            <label>Update Delivery Status *</label>
            <select
              className="form-control"
              value={statusUpdateData.status}
              onChange={(e) => setStatusUpdateData({...statusUpdateData, status: e.target.value})}
            >
              <option value="In Transit">In Transit</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered (Fulfillment Complete)</option>
              <option value="Delayed">Delayed / Exception</option>
            </select>
          </div>

          <div className="form-group">
            <label>Current Waypoint / Location *</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Pune Regional Hub Sort Facility"
              className="form-control" 
              value={statusUpdateData.current_location} 
              onChange={(e) => setStatusUpdateData({...statusUpdateData, current_location: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label>Transit Notes / Remarks</label>
            <textarea 
              rows="2"
              className="form-control" 
              value={statusUpdateData.notes} 
              onChange={(e) => setStatusUpdateData({...statusUpdateData, notes: e.target.value})} 
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setEditingShipment(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Waypoint Update
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
