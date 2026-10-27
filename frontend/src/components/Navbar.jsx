import React from 'react';
import { RefreshCw, Database } from 'lucide-react';

export default function Navbar({ activeTitle, healthStatus, onRefresh, loading }) {
  return (
    <header className="top-navbar">
      <div className="navbar-title">
        <h2>{activeTitle}</h2>
      </div>

      <div className="navbar-actions">
        <div className="system-status-pill">
          <span className="pulse-dot"></span>
          <span>Backend: {healthStatus?.engine?.toUpperCase() || 'CONNECTED'}</span>
        </div>

        <button 
          onClick={onRefresh} 
          disabled={loading} 
          className="btn btn-secondary btn-sm"
          title="Refresh current data"
        >
          <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
          <span>Sync</span>
        </button>
      </div>
    </header>
  );
}
