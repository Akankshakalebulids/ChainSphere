import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Orders from './pages/Orders';
import Shipments from './pages/Shipments';
import Alerts from './pages/Alerts';

import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchGlobalState = async () => {
    try {
      setLoading(true);
      const [health, lowStock] = await Promise.all([
        api.getHealth().catch(() => ({ status: 'offline', engine: 'disconnected' })),
        api.getLowStockProducts().catch(() => [])
      ]);
      setHealthStatus(health);
      setLowStockCount(lowStock.length);
    } catch (e) {
      console.error("Failed to fetch global status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalState();
    const interval = setInterval(fetchGlobalState, 30000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const handleManualRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    showToast('Data refreshed from backend', 'info');
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'SmartChain Dashboard';
      case 'products': return 'Products & Inventory Catalog';
      case 'suppliers': return 'Suppliers & Vendors Directory';
      case 'orders': return 'Customer Order Operations';
      case 'shipments': return 'Shipment Tracking & Logistics';
      case 'alerts': return 'Safety Threshold Alerts';
      default: return 'SmartChain SCM';
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        lowStockCount={lowStockCount} 
      />

      <div className="main-wrapper">
        <Navbar 
          activeTitle={getPageTitle()} 
          healthStatus={healthStatus} 
          onRefresh={handleManualRefresh}
          loading={loading}
        />

        <main className="page-container" key={`${activeTab}-${refreshTrigger}`}>
          {activeTab === 'dashboard' && (
            <Dashboard 
              setActiveTab={setActiveTab} 
              showToast={showToast} 
            />
          )}
          {activeTab === 'products' && (
            <Products 
              showToast={showToast} 
            />
          )}
          {activeTab === 'suppliers' && (
            <Suppliers 
              showToast={showToast} 
            />
          )}
          {activeTab === 'orders' && (
            <Orders 
              showToast={showToast} 
              setActiveTab={setActiveTab} 
            />
          )}
          {activeTab === 'shipments' && (
            <Shipments 
              showToast={showToast} 
            />
          )}
          {activeTab === 'alerts' && (
            <Alerts 
              showToast={showToast} 
              onInventoryChange={fetchGlobalState} 
            />
          )}
        </main>
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
