import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Star, Clock, Mail, Phone, MapPin, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../services/api';

export default function Suppliers({ showToast }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'India',
    lead_time_days: 5,
    rating: 4.5,
    is_active: true
  });

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await api.getSuppliers(search);
      setSuppliers(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'India',
      lead_time_days: 5,
      rating: 4.5,
      is_active: true
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      contact_person: s.contact_person || '',
      email: s.email,
      phone: s.phone || '',
      address: s.address || '',
      city: s.city || '',
      country: s.country || 'India',
      lead_time_days: s.lead_time_days,
      rating: s.rating,
      is_active: s.is_active
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        lead_time_days: parseInt(formData.lead_time_days, 10),
        rating: parseFloat(formData.rating)
      };

      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, payload);
        showToast(`Supplier '${payload.name}' updated!`, 'success');
        setEditingSupplier(null);
      } else {
        await api.createSupplier(payload);
        showToast(`Supplier '${payload.name}' registered!`, 'success');
        setIsAddModalOpen(false);
      }
      loadSuppliers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete supplier '${name}'? Linked products will have supplier set to null.`)) return;
    try {
      await api.deleteSupplier(id);
      showToast(`Supplier deleted.`, 'success');
      loadSuppliers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div className="page-header-text">
          <h3>Supplier Relationship Management</h3>
          <p>Manage vendors, lead times, delivery ratings, and procurement contacts</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} />
          <span>Register Supplier</span>
        </button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input-box">
            <Search size={16} color="var(--gray-400)" />
            <input 
              type="text" 
              placeholder="Search vendor by name, email, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadSuppliers()}
            />
          </div>
          <button onClick={loadSuppliers} className="btn btn-secondary btn-sm">Filter</button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>No suppliers found.</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Supplier Company</th>
                <th>Contact Person</th>
                <th>Contact Details</th>
                <th>Location</th>
                <th>Avg Lead Time</th>
                <th>Rating</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>ID: #{s.id}</div>
                  </td>
                  <td>{s.contact_person || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                      <Mail size={12} color="var(--gray-400)" />
                      <span>{s.email}</span>
                    </div>
                    {s.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                        <Phone size={12} color="var(--gray-400)" />
                        <span>{s.phone}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                      <MapPin size={12} color="var(--gray-400)" />
                      <span>{s.city ? `${s.city}, ${s.country}` : s.country}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <Clock size={13} color="var(--primary)" />
                      <span>{s.lead_time_days} days</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#d97706', fontSize: '0.85rem' }}>
                      <Star size={14} fill="#d97706" color="#d97706" />
                      <span>{s.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${s.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleOpenEdit(s)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Supplier"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id, s.name)}
                        className="btn btn-danger btn-sm"
                        title="Delete Supplier"
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

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen || Boolean(editingSupplier)}
        onClose={() => { setIsAddModalOpen(false); setEditingSupplier(null); }}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Register New Supplier'}
        maxWidth="580px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Supplier Company Name *</label>
            <input 
              type="text" 
              required 
              className="form-control" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Contact Person</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.contact_person} 
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input 
                type="email" 
                required 
                className="form-control" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.city} 
                onChange={(e) => setFormData({...formData, city: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Street Address</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.address} 
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Average Lead Time (Days) *</label>
              <input 
                type="number" 
                min="1" 
                max="90" 
                required 
                className="form-control" 
                value={formData.lead_time_days} 
                onChange={(e) => setFormData({...formData, lead_time_days: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Quality Rating (1.0 - 5.0) *</label>
              <input 
                type="number" 
                step="0.1" 
                min="1.0" 
                max="5.0" 
                required 
                className="form-control" 
                value={formData.rating} 
                onChange={(e) => setFormData({...formData, rating: e.target.value})} 
              />
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              onClick={() => { setIsAddModalOpen(false); setEditingSupplier(null); }} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingSupplier ? 'Update Supplier' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
