import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Truck, 
  AlertTriangle,
  Layers
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, lowStockCount }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products & Inventory', icon: Package },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'orders', label: 'Customer Orders', icon: ShoppingCart },
    { id: 'shipments', label: 'Shipment Tracking', icon: Truck },
    { id: 'alerts', label: 'Low-Stock Alerts', icon: AlertTriangle, badge: lowStockCount },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <Layers size={22} />
        </div>
        <div className="logo-text">
          <h1>SmartChain</h1>
          <span>SCM System v1.0</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {Boolean(item.badge && item.badge > 0) && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div>
          <strong>College Project</strong>
          <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>FastAPI + React + MySQL</div>
        </div>
      </div>
    </aside>
  );
}
