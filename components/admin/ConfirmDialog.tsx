"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Styled confirmation dialog — replaces the ugly `window.confirm()` with
 * a modal that matches the project design. Renders nothing when `open` is false.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-saffron-100 bg-white p-6 shadow-card">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-saffron-50 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${danger ? "bg-red-100" : "bg-saffron-100"}`}>
          <AlertTriangle className={`h-6 w-6 ${danger ? "text-red-600" : "text-saffron-600"}`} />
        </div>

        <h3 className="mt-4 text-center font-display text-lg font-bold text-ink">
          {title}
        </h3>
        <p className="mt-2 text-center text-sm leading-relaxed text-ink-soft">
          {message}
        </p>

        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="btn-outline flex-1">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all ${
              danger
                ? "bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-soft"
                : "btn-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
