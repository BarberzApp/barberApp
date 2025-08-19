import { useState, useCallback } from 'react';
import { ToastProps } from './toast';

interface ToastOptions {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      id,
      ...options,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after duration
    if (options.duration !== 0) {
      setTimeout(() => {
        dismiss(id);
      }, options.duration || 5000);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    toast,
    dismiss,
    dismissAll,
  };
};

export default useToast; 