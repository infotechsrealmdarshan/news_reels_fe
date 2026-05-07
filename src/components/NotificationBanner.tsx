"use client";

import React, { useState, useEffect } from 'react';
import { X, Info, AlertTriangle } from 'lucide-react';

interface NotificationBannerProps {
  message: string;
  type?: 'info' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
}

export function NotificationBanner({ message, type = 'info', duration = 5000, onClose }: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const icons = {
    info: <Info size={20} />,
    warning: <AlertTriangle size={20} />,
    error: <AlertTriangle size={20} />
  };

  const colors = {
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400'
  };

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg border backdrop-blur-md ${colors[type]}`}>
      {icons[type]}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="p-1 hover:bg-white/10 rounded transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
