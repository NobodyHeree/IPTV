import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, WifiOff, Server, Tv } from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

// Icon mapping
const iconMap = {
    'success': CheckCircle,
    'error': AlertCircle,
    'warning': AlertTriangle,
    'info': Info,
    'wifi-off': WifiOff,
    'server': Server,
    'tv': Tv,
    'alert-circle': AlertCircle,
    'alert-triangle': AlertTriangle,
};

// Color mapping
const colorMap = {
    'success': 'bg-green-500/20 border-green-500/30 text-green-400',
    'error': 'bg-red-500/20 border-red-500/30 text-red-400',
    'warning': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    'info': 'bg-blue-500/20 border-blue-500/30 text-blue-400',
};

// Individual Toast component
const Toast = ({ id, type = 'info', title, message, icon, onClose }) => {
    const IconComponent = iconMap[icon] || iconMap[type] || AlertCircle;
    const colorClass = colorMap[type] || colorMap['info'];

    useEffect(() => {
        const timer = setTimeout(() => onClose(id), 5000);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`flex items-start gap-4 p-4 rounded-xl border backdrop-blur-md ${colorClass} max-w-sm shadow-lg`}
        >
            <IconComponent className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm">{title}</h4>
                {message && <p className="text-sm opacity-80 mt-1">{message}</p>}
            </div>
            <button
                onClick={() => onClose(id)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-3">
        <AnimatePresence>
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={removeToast} />
            ))}
        </AnimatePresence>
    </div>
);

// Toast Provider
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((options) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, ...options }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Convenience methods
    const toast = {
        success: (title, message) => addToast({ type: 'success', title, message }),
        error: (title, message) => addToast({ type: 'error', title, message }),
        warning: (title, message) => addToast({ type: 'warning', title, message }),
        info: (title, message) => addToast({ type: 'info', title, message }),
        custom: (options) => addToast(options),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastProvider;
