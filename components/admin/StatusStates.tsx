"use client";

import type { ReactNode } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";

/** Full-height loading skeleton for admin panels. */
export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-saffron-500" />
      <p className="mt-3 text-sm text-ink-soft">{message}</p>
    </div>
  );
}

/** Styled error banner with optional retry. */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
      <p className="mt-2 text-sm font-semibold text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline mt-3 !text-xs">
          Try Again
        </button>
      )}
    </div>
  );
}

/** Friendly empty state with icon and message. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-saffron-50 px-4 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-saffron-100 text-2xl">
        {icon ?? <Inbox className="h-7 w-7 text-saffron-400" />}
      </div>
      <h3 className="mt-3 font-display text-base font-bold text-ink">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
