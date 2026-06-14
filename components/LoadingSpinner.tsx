"use client";

import React from "react";
import { Activity, Cpu } from "lucide-react";

export interface LoadingSpinnerProps {
  /** Loading message to display */
  message?: string;
  /** Accent color for the spinner */
  accent?: "emerald" | "cyan" | "purple" | "fuchsia" | "amber";
  /** Icon variant */
  icon?: "activity" | "cpu";
  /** Extra vertical padding */
  size?: "sm" | "md" | "lg";
}

/**
 * Reusable loading spinner with configurable accent and message.
 * Replaces the duplicated loading state pattern across all data-fetching pages.
 */
export default function LoadingSpinner({
  message = "Loading...",
  accent = "emerald",
  icon = "activity",
  size = "md",
}: LoadingSpinnerProps) {
  const iconColors = {
    emerald: "text-emerald-400",
    cyan: "text-cyan-400",
    purple: "text-purple-400",
    fuchsia: "text-fuchsia-400",
    amber: "text-amber-400",
  };

  const paddings = {
    sm: "py-8",
    md: "py-16",
    lg: "py-24",
  };

  const Icon = icon === "cpu" ? Cpu : Activity;

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${paddings[size]}`}>
      <Icon className={`w-8 h-8 ${iconColors[accent]} animate-spin`} />
      <span className="text-xs text-slate-400 font-medium">{message}</span>
    </div>
  );
}
