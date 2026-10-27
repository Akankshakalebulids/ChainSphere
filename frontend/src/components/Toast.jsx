import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let typeClass = 'toast-info';
        let Icon = Info;
        if (toast.type === 'success') {
          typeClass = 'toast-success';
          Icon = CheckCircle2;
        } else if (toast.type === 'error') {
          typeClass = 'toast-error';
          Icon = AlertCircle;
        }

        return (
          <div key={toast.id} className={`toast ${typeClass}`}>
            <Icon size={18} />
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button 
              onClick={() => onDismiss(toast.id)} 
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
