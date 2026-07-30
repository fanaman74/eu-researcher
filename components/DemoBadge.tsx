"use client";

import React from "react";
import { FlaskConical } from "lucide-react";

export interface DemoBadgeProps {
  className?: string;
}

/**
 * Small amber pill marking a section backed by hardcoded sample (demo) data.
 */
export default function DemoBadge({ className = "" }: DemoBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full ${className}`}
      title="This view is currently fed by hardcoded sample data"
    >
      <FlaskConical className="w-3 h-3" /> Demo data
    </span>
  );
}
