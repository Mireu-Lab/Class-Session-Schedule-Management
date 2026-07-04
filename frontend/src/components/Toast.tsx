import React, { useEffect } from 'react';
import * as Icons from 'lucide-react';

interface ToastProps {
  message: string;
  iconName: string;
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, iconName, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  // Dynamically get the icon component or default to Info
  const IconComponent = (Icons as any)[iconName] || Icons.Info;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs flex items-center gap-2.5 transition-all duration-300 pointer-events-none z-[100] w-[90%] sm:w-auto ${
        visible ? 'translate-y-0 opacity-100 font-medium' : '-translate-y-12 opacity-0'
      }`}
    >
      <IconComponent className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
      <span className="font-semibold">{message}</span>
    </div>
  );
}
