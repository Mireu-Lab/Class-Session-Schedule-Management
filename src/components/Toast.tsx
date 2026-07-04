import React, { useEffect, useRef, useState } from 'react';
import * as Icons from 'lucide-react';

interface ToastProps {
  message: string;
  iconName: string;
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, iconName, visible, onClose }: ToastProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const timerRef = useRef<any>(null);

  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onClose();
    }, 3000);
  };

  useEffect(() => {
    if (visible) {
      setOffset({ x: 0, y: 0 });
      setIsDragging(false);
      startTimer();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, onClose]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({ x: dx, y: dy });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    const threshold = 80; // Swipe distance threshold in pixels
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      // Swiped past threshold - dismiss
      onClose();
    } else {
      // Return to center and restart auto-dismiss timer
      setOffset({ x: 0, y: 0 });
      startTimer();
    }
  };

  // Dynamically get the icon component or default to Info
  const IconComponent = (Icons as any)[iconName] || Icons.Info;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-[100] w-[90%] sm:w-auto transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-12 opacity-0 pointer-events-none'
      }`}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          setIsDragging(false);
          setOffset({ x: 0, y: 0 });
          startTimer();
        }}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          touchAction: 'none',
        }}
        className={`bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs flex items-center gap-2.5 cursor-grab active:cursor-grabbing select-none w-full sm:w-auto ${
          isDragging ? '' : 'transition-transform duration-300'
        }`}
      >
        <IconComponent className="w-4.5 h-4.5 text-indigo-400 shrink-0 pointer-events-none" />
        <span className="font-semibold pointer-events-none">{message}</span>
      </div>
    </div>
  );
}

