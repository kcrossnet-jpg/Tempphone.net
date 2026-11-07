import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  const isSuccess = toast.type !== 'error';

  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded bg-[#5B3A5C] text-[#E9DEC3] border-2 border-[#221D16] shadow-[6px_6px_0_rgba(34,29,22,0.35)] font-mono-retro text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-bottom-5 duration-200"
      style={{
        backgroundColor: isSuccess ? '#5B3A5C' : '#B23A2E'
      }}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 text-[#E9DEC3] shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-[#E9DEC3] shrink-0" />
      )}
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-75 p-0.5 rounded text-[#E9DEC3]"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
