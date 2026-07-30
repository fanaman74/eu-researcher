"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export interface ErrorBannerProps {
  /** Message to display (defaults to a generic load failure) */
  message?: string;
  /** Retry callback — when provided, a retry button is shown */
  onRetry?: () => void;
}

/**
 * Shared inline error banner for failed data fetches.
 * Replaces silent console-only error handling across data pages.
 */
export default function ErrorBanner({
  message = "Failed to load data. Please try again.",
  onRetry,
}: ErrorBannerProps) {
  return (
    <div className="p-4 border border-red-500/20 bg-red-500/10 text-red-400 text-xs rounded-md flex items-center justify-between gap-3">
      <span className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        {message}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3 h-3" /> Retry
        </button>
      )}
    </div>
  );
}
