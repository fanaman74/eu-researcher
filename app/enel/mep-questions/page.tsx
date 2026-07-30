"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import RegistryTablePage from "@/components/RegistryTablePage";
import SummarizerModal from "@/components/SummarizerModal";
import { type ParliamentQuestion, type SummarizerConfig } from "@/lib/types";

export default function MepQuestionsPage() {
  const [selectedQuestionForAnswer, setSelectedQuestionForAnswer] = useState<ParliamentQuestion | null>(null);

  // Custom fetcher: drafts the official Commission answer via the chat coordinator
  // instead of the EUR-Lex document summarizer.
  const fetchAnswerSummary = useCallback(async (_doc: SummarizerConfig, _detailed: boolean, signal: AbortSignal): Promise<string> => {
    const question = selectedQuestionForAnswer;
    if (!question) throw new Error("No question selected.");

    const prompt = `Draft a realistic, highly professional, and precise summarized official answer (approximately 200 words) from the European Commission in response to European Parliament Question ${question.id}.
      Topic: "${question.title}".
      Asked by ${question.askedBy} to ${question.target}.
      The question text was: "${question.content}".

      Structure your response clearly with two sections:
      1. COMMISSION'S RESPONSE & POSITION (Presenting the EC stance, any regulatory decisions, energy limits, or concessions)
      2. ADVOCACY IMPACT FOR ENEL (Providing a brief strategic takeaway analysis detailing how this EC stance impacts Enel Green Power or distributed power grids in Brussels lobbying context)`;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "user", content: prompt }
        ]
      }),
      signal
    });

    if (!res.ok) throw new Error("Failed to load official answer.");
    const data = await res.json();
    return data.content as string;
  }, [selectedQuestionForAnswer]);

  return (
    <>
      <RegistryTablePage<ParliamentQuestion>
        title="MEP Questions Registry"
        subtitle="European Parliament Legislative Tracking System Watcher"
        icon={BarChart3}
        accent="purple"
        endpoint="/api/parliament"
        dataKey="questions"
        countLabel={(n) => `${n} Questions Tracked`}
        demo
        searchPlaceholder="Filter by question CELEX ID, title, asked by, committee..."
        filterItem={(item, search) => {
          const q = search.toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            item.askedBy.toLowerCase().includes(q) ||
            item.committee.toLowerCase().includes(q)
          );
        }}
        loadingMessage="Loading parliamentary questions..."
        emptyMessage="No parliamentary questions match your filtering criteria."
        columns={[
          { header: "Question ID", className: "p-4 w-36" },
          { header: "Legislative Topic", className: "p-4 min-w-[280px]" },
          { header: "Asked By", className: "p-4 w-44" },
          { header: "Committee", className: "p-4 w-28" },
          { header: "Status", className: "p-4 w-32" },
          { header: "Risk Level", className: "p-4 w-28" },
          { header: "Risk Rationale", className: "p-4 w-32" },
          { header: "Action", className: "p-4 w-28 text-center" }
        ]}
        rowKey={(item) => item.id}
        renderRow={(item) => {
          const isHigh = item.risk === "High Risk";
          const isMed = item.risk === "Med Risk";
          const riskBadge = isHigh
            ? "bg-red-500/10 border-red-500/20 text-red-400"
            : isMed
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
          return (
            <tr className="hover:bg-slate-900/35 transition-colors duration-150">
              <td className="p-4 font-mono font-bold text-purple-400">{item.id}</td>
              <td className="p-4 font-medium text-slate-200">
                <div className="space-y-1">
                  <div>{item.title}</div>
                  <div className="text-[10px] text-slate-500 font-normal leading-relaxed">{item.content}</div>
                </div>
              </td>
              <td className="p-4 text-slate-300">
                <div className="font-semibold">{item.askedBy}</div>
                <div className="text-[10px] text-slate-500 font-mono">Target: {item.target}</div>
              </td>
              <td className="p-4 font-mono font-bold text-slate-400">{item.committee}</td>
              <td className="p-4">
                {item.status === "Answered" ? (
                  <button
                    onClick={() => setSelectedQuestionForAnswer(item)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold bg-emerald-950/40 border border-emerald-900 text-emerald-400 cursor-pointer hover:bg-emerald-900/30 hover:border-emerald-800 transition-all active:scale-[0.97]"
                    title="Click to view summarized Commission answer"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    {item.status}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold bg-amber-950/40 border border-amber-900 text-amber-400 select-none">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {item.status}
                  </span>
                )}
              </td>
              <td className="p-4">
                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${riskBadge}`}>
                  {isHigh && <AlertTriangle className="w-3 h-3" />}
                  {item.risk}
                </span>
              </td>
              <td className="p-4 text-slate-400 text-[10.5px] leading-relaxed max-w-[200px]">{item.riskRationale}</td>
              <td className="p-4 text-center">
                <Link
                  href={`/parliament`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Vote Tracker <ExternalLink className="w-3 h-3" />
                </Link>
              </td>
            </tr>
          );
        }}
      />

      <SummarizerModal
        isOpen={!!selectedQuestionForAnswer}
        onClose={() => setSelectedQuestionForAnswer(null)}
        document={selectedQuestionForAnswer ? {
          title: selectedQuestionForAnswer.title,
          snippet: selectedQuestionForAnswer.content,
          namespace: "parliament",
          celex: selectedQuestionForAnswer.id
        } : null}
        accent="purple"
        idLabel="Question ID"
        headerLabel="Official Answer Drafter"
        loadingMessage="Parsing EC plenary minutes & summarizing lobby counter-advocacy stance..."
        fetchSummary={fetchAnswerSummary}
      />
    </>
  );
}
