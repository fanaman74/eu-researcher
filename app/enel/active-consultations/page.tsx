"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  ExternalLink,
  TrendingUp
} from "lucide-react";
import RegistryTablePage from "@/components/RegistryTablePage";
import { type Consultation } from "@/lib/types";

export default function ActiveConsultationsPage() {
  return (
    <RegistryTablePage<Consultation>
      title="Active Consultations Registry"
      subtitle="European Commission Have Your Say Public Portal Feed"
      icon={Users}
      accent="amber"
      endpoint="/api/have-your-say"
      dataKey="consultations"
      countLabel={(n) => `${n} Total Inquiries`}
      demo
      searchPlaceholder="Filter consultations by PID, title or status..."
      filterItem={(item, search) => {
        const q = search.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.pid.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q)
        );
      }}
      loadingMessage="Loading active public consultations..."
      emptyMessage="No consultations match your filtering criteria."
      columns={[
        { header: "PID", className: "p-4 w-32" },
        { header: "Consultation Title", className: "p-4 min-w-[280px]" },
        { header: "Status", className: "p-4 w-44" },
        { header: "Submissions", className: "p-4 w-32 text-right" },
        { header: "Closing Date", className: "p-4 w-36" },
        { header: "Enel Alignment", className: "p-4 w-40" },
        { header: "Action", className: "p-4 w-28 text-center" }
      ]}
      rowKey={(item) => item.pid}
      renderRow={(item) => (
        <tr className="hover:bg-slate-900/35 transition-colors duration-150">
          <td className="p-4 font-mono font-bold text-amber-400">{item.pid}</td>
          <td className="p-4 font-medium text-slate-200">
            <div className="space-y-0.5">
              <div>{item.title}</div>
              <div className="text-[10px] text-slate-500 font-normal">Pre-filtered target for DG ENER lobby campaign</div>
            </div>
          </td>
          <td className="p-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${
              item.status.includes("Open")
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}>
              <span className={`w-1 h-1 rounded-full ${item.status.includes("Open") ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {item.status}
            </span>
          </td>
          <td className="p-4 text-right font-mono font-bold text-slate-300">{item.totalSubmissions}</td>
          <td className="p-4 font-mono text-slate-400">{item.closingDate}</td>
          <td className="p-4">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" /> {item.enelAlignment}
            </span>
          </td>
          <td className="p-4 text-center">
            <Link
              href={`/have-your-say?pid=${item.pid}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Lobby Parser <ExternalLink className="w-3 h-3" />
            </Link>
          </td>
        </tr>
      )}
    />
  );
}
