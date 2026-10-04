"use client";

interface BookingCancelDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BookingCancelDialog({
  onConfirm,
  onCancel,
}: BookingCancelDialogProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
      <p className="text-xs font-semibold text-red-700">
        Cancel this booking? Your seat will be released and a refund
        initiated within 5–7 business days.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700"
        >
          Yes, Cancel Booking
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
        >
          Keep Booking
        </button>
      </div>
    </div>
  );
}
