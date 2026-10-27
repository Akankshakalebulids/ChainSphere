import React from 'react';

export default function StatCard({ title, value, icon: Icon, color, bgColor, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <span>{title}</span>
        <h3>{value}</h3>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            {subtitle}
          </div>
        )}
      </div>
      <div className="stat-icon-wrapper" style={{ backgroundColor: bgColor || 'var(--primary-light)', color: color || 'var(--primary)' }}>
        <Icon size={22} />
      </div>
    </div>
  );
}
