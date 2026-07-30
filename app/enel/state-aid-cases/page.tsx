"use client";

import React, { useState } from "react";
import {
  Scale,
  ExternalLink,
  FileText
} from "lucide-react";
import RegistryTablePage from "@/components/RegistryTablePage";
import { type EurLexHit } from "@/lib/types";

export default function StateAidCasesPage() {
  const [cases, setCases] = useState<EurLexHit[]>([]);
  const [selectedSector, setSelectedSector] = useState("All");

  const getSectorCount = (sectorName: string) => {
    if (sectorName === "All") return cases.length;
    return cases.filter(item => item.sector === sectorName).length;
  };

  return (
    <RegistryTablePage<EurLexHit>
      title="DG COMP State Aid Watcher"
      subtitle="EUR-Lex SPARQL Cellar Database Crawler — Pre-filtered for State Support Decisions"
      icon={Scale}
      accent="emerald"
      endpoint="/api/eurlex?q=state aid energy&top_k=15"
      dataKey="hits"
      countLabel={(n) => `${n} Cases Tracked`}
      demo
      searchPlaceholder="Filter cases by CELEX ID, ruling title, or legal sector..."
      filterItem={(item, search) => {
        const q = search.toLowerCase();
        const matchesSearch =
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.sector.toLowerCase().includes(q);
        const matchesSector = selectedSector === "All" || item.sector === selectedSector;
        return matchesSearch && matchesSector;
      }}
      loadingMessage="Querying publications office SPARQL endpoint..."
      emptyMessage="No state aid cases match your filtering criteria."
      onLoaded={setCases}
      toolbarExtras={
        <div className="flex flex-row items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mr-2 shrink-0">Sector:</span>
          {["All", "Case Law", "Preparatory Documents", "Secondary Legislation"].map((sector) => {
            const isActive = selectedSector === sector;
            const count = getSectorCount(sector);
            return (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                className={`px-4 py-2 rounded-full border text-[11px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "bg-slate-900/60 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                }`}
              >
                {sector}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  isActive ? "bg-emerald-500/25 text-emerald-300" : "bg-slate-950 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      }
      columns={[
        { header: "CELEX ID", className: "p-4 w-36" },
        { header: "Legal Ruling / Decision", className: "p-4 min-w-[280px]" },
        { header: "Sector", className: "p-4 w-40" },
        { header: "Scope", className: "p-4 w-28" },
        { header: "Action", className: "p-4 w-32 text-center" }
      ]}
      rowKey={(item) => item.id}
      renderRow={(item) => (
        <tr className="hover:bg-slate-900/35 transition-colors duration-150">
          <td className="p-4 font-mono font-bold text-emerald-400">{item.id}</td>
          <td className="p-4 font-medium text-slate-200">
            <div className="space-y-1">
              <div>{item.title}</div>
              <div className="text-[10px] text-slate-500 font-mono leading-relaxed">{item.snippet}</div>
            </div>
          </td>
          <td className="p-4 text-slate-400 font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px]">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> {item.sector}
            </span>
          </td>
          <td className="p-4 font-mono text-slate-500 font-bold uppercase">{item.country}</td>
          <td className="p-4 text-center">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              EUR-Lex Record <ExternalLink className="w-3 h-3" />
            </a>
          </td>
        </tr>
      )}
    />
  );
}
