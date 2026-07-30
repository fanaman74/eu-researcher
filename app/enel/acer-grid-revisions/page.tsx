"use client";

import React from "react";
import Link from "next/link";
import {
  Zap,
  ExternalLink,
  Cpu
} from "lucide-react";
import RegistryTablePage from "@/components/RegistryTablePage";
import { type ComitologyVote } from "@/lib/types";

export default function AcerGridRevisionsPage() {
  return (
    <RegistryTablePage<ComitologyVote>
      title="ACER Grid Revisions Watcher"
      subtitle="European Comitology Register Watcher — Pre-filtered for smart grid codes & delegated revisions"
      icon={Zap}
      accent="cyan"
      endpoint="/api/comitology"
      dataKey="votes"
      countLabel={(n) => `${n} Revisions Tracked`}
      demo
      searchPlaceholder="Filter grid codes by ID, measure title, register ID, status..."
      filterItem={(item, search) => {
        const q = search.toLowerCase();
        return (
          item.measure.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.registerId.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q)
        );
      }}
      loadingMessage="Fetching technical comitology votes..."
      emptyMessage="No grid revisions match your filtering criteria."
      columns={[
        { header: "Vote ID", className: "p-4 w-36" },
        { header: "Technical Grid Measure", className: "p-4 min-w-[280px]" },
        { header: "Register ID", className: "p-4 w-40" },
        { header: "Sitting Date", className: "p-4 w-32" },
        { header: "Chairperson", className: "p-4 w-36" },
        { header: "Vote Split", className: "p-4 w-44" },
        { header: "Status", className: "p-4 w-32" },
        { header: "Action", className: "p-4 w-28 text-center" }
      ]}
      rowKey={(item) => item.id}
      renderRow={(item) => (
        <tr className="hover:bg-slate-900/35 transition-colors duration-150">
          <td className="p-4 font-mono font-bold text-cyan-400">{item.id}</td>
          <td className="p-4 font-medium text-slate-200">
            <div className="space-y-1">
              <div>{item.measure}</div>
              <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl space-y-1 relative overflow-hidden mt-1.5 max-w-[400px]">
                <div className="absolute top-1.5 right-2 flex items-center gap-1 text-slate-600">
                  <Cpu className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                  <span className="text-[8px] font-mono font-bold tracking-widest uppercase">Advocate AI</span>
                </div>
                <h5 className="text-[9px] font-mono font-extrabold text-cyan-400 uppercase">Strategic Lobby Impact</h5>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{item.strategicImpact}</p>
              </div>
            </div>
          </td>
          <td className="p-4 font-mono font-bold text-slate-300">{item.registerId}</td>
          <td className="p-4 font-mono text-slate-400">{item.date}</td>
          <td className="p-4 text-slate-400">{item.chairperson}</td>
          <td className="p-4 text-slate-300">
            <div className="space-y-1 font-mono font-bold text-[10px]">
              <div className="flex justify-between w-32">
                <span className="text-emerald-400">IN FAVOUR:</span>
                <span>{item.votingSheet.inFavour}</span>
              </div>
              <div className="flex justify-between w-32">
                <span className="text-red-400">AGAINST:</span>
                <span>{item.votingSheet.against}</span>
              </div>
              <div className="text-[9px] text-slate-500 font-normal">
                Abstentions: {item.votingSheet.abstentions}
              </div>
            </div>
          </td>
          <td className="p-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400">
              {item.status}
            </span>
          </td>
          <td className="p-4 text-center">
            <Link
              href={`/comitology?id=${item.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Comitology <ExternalLink className="w-3 h-3" />
            </Link>
          </td>
        </tr>
      )}
    />
  );
}
