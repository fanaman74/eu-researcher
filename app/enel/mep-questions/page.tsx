"use client";

import React from "react";
import {
  BarChart3,
  ExternalLink,
  Clock,
  CheckCircle
} from "lucide-react";
import RegistryTablePage from "@/components/RegistryTablePage";
import { type ParliamentQuestion } from "@/lib/types";

export default function MepQuestionsPage() {
  return (
    <RegistryTablePage<ParliamentQuestion>
      title="MEP Questions Registry"
      subtitle="Live European Parliament written questions — energy-related, from the EP Open Data Portal"
      icon={BarChart3}
      accent="purple"
      endpoint="/api/parliament"
      dataKey="questions"
      countLabel={(n) => `${n} Energy Questions Tracked`}
      searchPlaceholder="Filter by question ID, topic, or MEP name..."
      filterItem={(item, search) => {
        const q = search.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.askedBy.toLowerCase().includes(q)
        );
      }}
      loadingMessage="Loading parliamentary questions..."
      emptyMessage="No energy-related questions found in the tracked window yet."
      columns={[
        { header: "Question ID", className: "p-4 w-36" },
        { header: "Topic", className: "p-4 min-w-[280px]" },
        { header: "Asked By", className: "p-4 w-56" },
        { header: "Date", className: "p-4 w-28" },
        { header: "Status", className: "p-4 w-36" },
        { header: "Source", className: "p-4 w-32 text-center" }
      ]}
      rowKey={(item) => item.id}
      renderRow={(item) => (
        <tr className="hover:bg-slate-900/35 transition-colors duration-150">
          <td className="p-4 font-mono font-bold text-purple-400">{item.id}</td>
          <td className="p-4 font-medium text-slate-200">{item.title}</td>
          <td className="p-4 text-slate-300">
            <div className="font-semibold">{item.askedBy}</div>
            <div className="text-[10px] text-slate-500 font-mono">To: {item.target}</div>
          </td>
          <td className="p-4 font-mono text-slate-400">{item.date}</td>
          <td className="p-4">
            {item.status === "Answered" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold bg-emerald-950/40 border-emerald-900 text-emerald-400">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Answered{item.answerDate ? ` ${item.answerDate}` : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold bg-amber-950/40 border-amber-900 text-amber-400 select-none">
                <Clock className="w-3 h-3 text-amber-400" />
                {item.status}
              </span>
            )}
          </td>
          <td className="p-4 text-center space-y-1">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
            >
              Question <ExternalLink className="w-3 h-3" />
            </a>
            {item.answerUrl && (
              <a
                href={item.answerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/30 border border-emerald-900 text-[10px] font-bold text-emerald-400 transition-colors"
              >
                Answer <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </td>
        </tr>
      )}
    />
  );
}
