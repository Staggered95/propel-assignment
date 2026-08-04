import { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Container - Bottom Left */}
      <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const types = {
    success: { icon: CheckCircle, color: 'text-success', border: 'border-success' },
    error: { icon: AlertCircle, color: 'text-error', border: 'border-error' },
    warning: { icon: AlertTriangle, color: 'text-warning', border: 'border-warning' },
    info: { icon: Info, color: 'text-info', border: 'border-info' },
  };

  const config = types[toast.type] || types.info;
  const Icon = config.icon;

  return (
    <div className={`pointer-events-auto flex items-start gap-3 bg-background-secondary border-l-4 ${config.border} p-4 rounded shadow-lg min-w-[300px] max-w-md animate-[slideIn_0.3s_ease-out]`}>
      <Icon className={`mt-0.5 ${config.color}`} size={18} />
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button onClick={onRemove} className="text-text-muted hover:text-text-primary transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};