import React from 'react';
import { AlertTriangle, Flame, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md bg-[#FAF6E9] border-2 border-[#221D16] rounded-xl shadow-[4px_4px_0px_#221D16] sm:shadow-[6px_6px_0px_#221D16] overflow-hidden my-auto">
        {/* Header */}
        <div className={`px-4 py-3 border-b-2 border-[#221D16] flex items-center justify-between ${isDestructive ? 'bg-[#B23A2E] text-[#FAF6E9]' : 'bg-[#E9DEC3] text-[#221D16]'}`}>
          <div className="flex items-center gap-2 font-mono font-bold text-sm uppercase tracking-wider">
            {isDestructive ? <Flame className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm font-mono text-[#221D16]/90 leading-relaxed">
            {message}
          </p>

          <div className="p-3 bg-[#E9DEC3]/60 border border-[#221D16]/20 rounded-lg text-xs font-mono text-[#221D16]/75">
            <strong>Notice:</strong> This action cannot be reversed. Released lines and tickets are flushed and returned to carrier rotation immediately.
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-white hover:bg-neutral-100 text-[#221D16] border-2 border-[#221D16] rounded-lg transition-colors cursor-pointer shadow-[2px_2px_0px_#221D16]"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white border-2 border-[#221D16] rounded-lg transition-colors cursor-pointer shadow-[2px_2px_0px_#221D16] flex items-center gap-1.5 ${
                isDestructive ? 'bg-[#B23A2E] hover:bg-[#8F2C22]' : 'bg-[#221D16] hover:bg-neutral-800'
              }`}
            >
              {isDestructive ? <Trash2 className="w-3.5 h-3.5" /> : null}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
