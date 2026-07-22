"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Scale, 
  Search, 
  Filter, 
  Calendar, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Radio,
  ExternalLink,
  ChevronRight,
  Compass,
  PlusCircle,
  Database,
  Check,
  RotateCcw,
  SlidersHorizontal
} from "lucide-react";
import { type PoliticalEvent } from "@/lib/types";
import { generateAnalysisPptx } from "@/lib/generatePptx";

export default function ItalianTrackerPage() {
  const [events, setEvents] = useState<PoliticalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PoliticalEvent | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filtering States
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [category, setCategory] = useState("");
  const [party, setParty] = useState("");
  const [days, setDays] = useState(60);

  // Ingestion Simulator States
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState(false);

  // OpenRouter Analysis Modal States
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analyzingEvent, setAnalyzingEvent] = useState<PoliticalEvent | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [pptxGenerating, setPptxGenerating] = useState(false);

  // Ingestion & Refresh States
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/cron");
      if (res.ok) {
        setLastRefreshed(new Date());
        await fetchEvents();
      }
    } catch (err) {
      console.error("Failed to sync data", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (sourceType) params.append("sourceType", sourceType);
      if (category) params.append("category", category);
      if (party) params.append("party", party);
      params.append("days", days.toString());

      const res = await fetch(`/api/politics-tracker?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        // Autoselect first event if none selected
        if (data.events?.length > 0) {
          // If the previously selected event is still in the new list, keep it selected. Otherwise select the first.
          const stillExists = data.events.find((e: PoliticalEvent) => e.id === selectedEvent?.id);
          if (!stillExists) {
            setSelectedEvent(data.events[0]);
          } else {
            setSelectedEvent(stillExists);
          }
        } else {
          setSelectedEvent(null);
        }
      }
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, sourceType, category, party, days]);

  const handleResetFilters = () => {
    setSearch("");
    setSourceType("");
    setCategory("");
    setParty("");
    setDays(60);
  };

  const handleAnalyzeEvent = async (evt: PoliticalEvent) => {
    setAnalyzingEvent(evt);
    setAnalysisModalOpen(true);
    setAnalyzing(true);
    setAnalysisText("");
    setCopySuccess(false);

    try {
      const res = await fetch("/api/politics-tracker/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: evt.title,
          description: evt.description,
          content: evt.content,
          sourceName: evt.sourceName,
          category: evt.category,
          impactLevel: evt.impactLevel,
          entities: evt.entities,
          tags: evt.tags
        })
      });

      if (!res.ok) {
        throw new Error("Failed to generate public affairs analysis.");
      }

      const data = await res.json();
      setAnalysisText(data.analysis);
    } catch (err: any) {
      setAnalysisText(`⚠️ Failed to draft political report: ${err.message || "An error occurred."}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyAnalysisToClipboard = () => {
    if (!analysisText) return;
    navigator.clipboard.writeText(analysisText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const downloadAnalysis = () => {
    if (!analyzingEvent || !analysisText) return;
    const blob = new Blob([analysisText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${analyzingEvent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_political_analysis.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAsPptx = async () => {
    if (!analyzingEvent || !analysisText) return;
    setPptxGenerating(true);
    try {
      await generateAnalysisPptx(analyzingEvent, analysisText);
    } catch (err: any) {
      console.error("PPTX generation failed:", err);
      alert(`Failed to generate presentation: ${err.message || "Unknown error"}`);
    } finally {
      setPptxGenerating(false);
    }
  };

  const handleSimulateIngestion = async (preset: string) => {
    setSimulationLoading(true);
    setSimulationSuccess(false);
    
    let payload = {};

    if (preset === "camera-vote") {
      payload = {
        title: "Chamber Committee Vote: Regional Energy Self-Sufficiency Framework",
        description: "Committee X (Productive Activities) passes critical amendment protecting grid priorities for solar microgrids.",
        content: "A bipartisan majority in the Chamber's Tenth Committee voted to fast-track self-generation approvals for industrial consumers in Piedmont and Veneto. Spurred by lobbying representing domestic manufacturing interests, the amendment limits Terna's ability to defer connection licenses for distributed battery facilities. This secures key advantages for grid-edge utilities. The vote was championed by Lega and FI, with PD voting in support after environmental audits were added.",
        sourceType: "Official",
        sourceName: "Dati Camera",
        sourceUrl: "https://dati.camera.it/ocd/votazione.rdf/v20260601-grid-edge",
        category: "Floor Vote",
        impactLevel: "High",
        entities: [
          { name: "Alberto Gusmeroli", role: "Committee Chairman", party: "Lega" }
        ],
        tags: ["Distributed Grid", "Microgrids", "Chamber", "Self-Generation"]
      };
    } else {
      payload = {
        title: "NewsData.io: Meloni Administration Announces Strategic Tariff Caps Overhaul",
        description: "Government decrees emergency cap overrides to secure industrial energy pricing corridors.",
        content: "As reported by NewsData.io, Prime Minister Giorgia Meloni has introduced an emergency decree-law addressing retail energy tariff surges. The measure bypasses regional consultative grids to set standard grid-fee deductions for manufacturing parks. This avoids DG COMP state-aid scrutiny by labeling the funds as regional infrastructure compensation assets.",
        sourceType: "News",
        sourceName: "NewsData.io",
        sourceUrl: "https://newsdata.io/articles/meloni-decree-tariff-infrastructure",
        category: "Political Statement",
        impactLevel: "High",
        entities: [
          { name: "Giorgia Meloni", role: "Prime Minister", party: "FdI" }
        ],
        tags: ["Tariff Cap", "Chamber", "State Aid", "Decarbonization"]
      };
    }

    try {
      const res = await fetch("/api/politics-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSimulationSuccess(true);
        setIsSimulatorOpen(false);
        fetchEvents();
        setTimeout(() => setSimulationSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
      {/* Mesh glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-2/3 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Main dashboard content container */}
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-8 z-10">
        
        {/* Navigation Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-6 gap-4 border-t-4 border-t-fuchsia-500 pt-4 rounded-t-xl">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-all"
            >
              ← Portal Gateway
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-violet-500 flex items-center justify-center text-slate-950 shadow-lg shadow-fuchsia-500/10">
              <Radio className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black font-sans uppercase tracking-tight text-white">Italian Political Watch</h1>
                <span className="text-[9px] font-mono tracking-widest bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 px-2 py-0.5 rounded-md uppercase font-bold">Roma Tracker</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">National Legislative movements, official committee votes, and policy aggregations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3.5 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-[10px] font-mono font-bold text-slate-300">Auto-Refresh: 2x/Day (00:00 & 12:00)</span>
            </div>
            <button
              onClick={handleSyncData}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all px-3 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
              title={lastRefreshed ? `Last refreshed: ${lastRefreshed.toLocaleTimeString()}` : "Trigger twice-daily data refresh"}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-fuchsia-400" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Live Data"}</span>
            </button>
            <button
              onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-950 bg-fuchsia-400 hover:bg-fuchsia-350 transition-all px-4 py-2.5 rounded-xl shadow-lg shadow-fuchsia-400/10 active:scale-95 cursor-pointer"
            >
              Simulation Deck <Sparkles className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>

        {/* Ingestion Simulator Drawer Panel */}
        {isSimulatorOpen && (
          <div className="bg-slate-900/60 border border-fuchsia-500/20 rounded-2xl p-6 backdrop-blur-md space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-fuchsia-400 flex items-center gap-2">
                <Database className="w-4 h-4" /> Live Ingestion Pipeline Simulator
              </h3>
              <button 
                onClick={() => setIsSimulatorOpen(false)}
                className="text-xs text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inject custom political events directly into the rolling database to test timeline updates and real-time transition physics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => handleSimulateIngestion("camera-vote")}
                disabled={simulationLoading}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-fuchsia-500/40 rounded-xl text-left space-y-2 group transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Preset: Chamber Committee</span>
                  <PlusCircle className="w-4 h-4 text-fuchsia-400 group-hover:scale-110 transition-all" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Ingest Committee Vote (Renewables)</h4>
                <p className="text-[10px] text-slate-500">Simulates legislative voting in Rome committee sessions.</p>
              </button>
              <button
                onClick={() => handleSimulateIngestion("news-data")}
                disabled={simulationLoading}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-fuchsia-500/40 rounded-xl text-left space-y-2 group transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Preset: NewsData.io Aggregator</span>
                  <PlusCircle className="w-4 h-4 text-fuchsia-400 group-hover:scale-110 transition-all" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Ingest Breaking Energy Policy Decrees</h4>
                <p className="text-[10px] text-slate-500">Simulates real-time Italian media coverage of cabinet decrees.</p>
              </button>
            </div>
          </div>
        )}

        {simulationSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Real-time Ingestion Successful! Event added at the top of the feed log.</span>
            <span className="text-[9px] font-mono">200 OK</span>
          </div>
        )}

        {/* Dashboard 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* COLUMN 1: FILTERS (1/4) */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-6 backdrop-blur-md h-fit">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-fuchsia-400" /> Filters
              </h3>
              {(search || sourceType || category || party || days !== 60) && (
                <button
                  onClick={handleResetFilters}
                  className="text-[10px] text-fuchsia-400 hover:text-fuchsia-350 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Keyword Search */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Search Keywords</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Query politicians, acts, tags..."
                  className="w-full bg-slate-950 border border-slate-905 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Source Type Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Source Stream</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSourceType(sourceType === "Official" ? "" : "Official")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${sourceType === "Official" ? "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-300" : "bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-250"}`}
                >
                  Official Gov
                </button>
                <button
                  onClick={() => setSourceType(sourceType === "News" ? "" : "News")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${sourceType === "News" ? "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-300" : "bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-250"}`}
                >
                  News Media
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Legislative Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl py-2 px-3 text-xs text-slate-350 focus:outline-none focus:border-fuchsia-500 cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="Floor Vote">Floor Vote</option>
                <option value="Committee Meeting">Committee Meeting</option>
                <option value="Political Statement">Political Statement</option>
                <option value="Corporate Regulation">Corporate Regulation</option>
                <option value="Legislative Act">Legislative Act</option>
              </select>
            </div>

            {/* Italian Party Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Key Party Involved</label>
              <div className="grid grid-cols-3 gap-1.5">
                {["FdI", "PD", "M5S", "Lega", "FI", "Other"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setParty(party === p ? "" : p)}
                    className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer uppercase ${party === p ? "bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-400" : "bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-350"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Window Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                <span>Archive Depth</span>
                <span className="font-mono text-fuchsia-400 font-bold">{days} Days</span>
              </div>
              <input
                type="range"
                min="7"
                max="60"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 transition-colors"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                <span>7 days</span>
                <span>30 days</span>
                <span>60 days</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2 & 3: LIVE STREAM TIMELINE (2/4) */}
          <div className="lg:col-span-2 flex flex-col h-[680px] gap-4">
            <div className="flex justify-between items-center px-2 shrink-0">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4.5 h-4.5 text-fuchsia-400 animate-pulse" /> Rolling Policy Stream ({events.length})
              </h3>
              <span className="text-[10px] font-mono text-slate-505">Ordered: Latest First</span>
            </div>

            {loading ? (
              <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3 flex-1">
                <Radio className="w-8 h-8 text-fuchsia-400 animate-spin" />
                <span className="text-xs text-slate-400">Syncing Rome legislative feeds...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-slate-900/10 border border-dashed border-slate-900 rounded-3xl p-12 text-center text-slate-500 italic text-xs flex-1 flex flex-col items-center justify-center">
                No active events matching filter criteria in the current {days}-day archive.
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                {events.map((evt) => {
                  const isSelected = selectedEvent?.id === evt.id;
                  const eventDate = new Date(evt.date).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  });

                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedEvent(evt);
                        }
                      }}
                      className={`w-full text-left p-5 bg-slate-950 border rounded-2xl space-y-3 transition-all hover:border-slate-800 cursor-pointer duration-200 focus:outline-none focus:border-fuchsia-500/50 ${isSelected ? "border-fuchsia-500/50 bg-slate-900/40 shadow-[0_0_15px_rgba(217,70,239,0.06)] scale-[1.01]" : "border-slate-900 hover:border-slate-855"}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-405">
                            {evt.sourceName}
                          </span>
                          <span className="text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-855 text-slate-350">
                            {evt.category}
                          </span>
                        </div>
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${evt.impactLevel === "High" ? "bg-red-500/10 border-red-500/20 text-red-400" : evt.impactLevel === "Medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                          {evt.impactLevel} Impact
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-200 leading-snug group-hover:text-fuchsia-400 transition-colors">
                        {evt.title}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-slate-505 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" /> {eventDate}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="flex gap-1">
                            {evt.tags.slice(0, 2).map((t, idx) => (
                              <span key={idx} className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 border border-slate-855">#{t}</span>
                            ))}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyzeEvent(evt);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-slate-950 transition-all font-bold text-[9px] cursor-pointer"
                          >
                            <Sparkles className="w-2.5 h-2.5" /> Analyze
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMN 4: DEEP EXTRACTION PANEL (1/4) */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-md h-[680px] flex flex-col justify-between gap-4">
            <div className="shrink-0 border-b border-slate-900 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-fuchsia-400 animate-pulse" /> AI Extraction & Risks
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Corporate briefing overview & policy analysis</p>
            </div>

            {selectedEvent ? (
              <div className="space-y-6 overflow-y-auto pr-1 flex-1">
                
                {/* Event Title Block */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-405">
                    {selectedEvent.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 leading-snug">
                    {selectedEvent.title}
                  </h4>
                </div>

                {/* Abstract Text */}
                <div className="space-y-2">
                  <h5 className="text-[9px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider">Abstract</h5>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedEvent.content}
                  </p>
                </div>

                {/* Lobbying Impact & Risk Analysis */}
                <div className="space-y-2 border-t border-slate-900 pt-4">
                  <h5 className="text-[9px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" /> Liaison Risk Assessment
                  </h5>
                  <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-400 leading-relaxed space-y-1">
                    <p>
                      {selectedEvent.impactLevel === "High" 
                        ? "🚨 CRITICAL THREAT: Immediately assess portfolio impacts. This decree fast-tracks connections but alters local regional tariffs, potentially destabilizing grid-connected margins."
                        : selectedEvent.impactLevel === "Medium"
                        ? "⚠️ MEDIUM ALERT: Monitor policy progression. Active advocacy required in committee levels to ensure protection clauses for large utility storage corridors."
                        : "ℹ️ LOW ADVISORY: System status nominal. Track personnel shuffling for commission coordinator roles to capture changing sentiments early."}
                    </p>
                  </div>
                </div>

                {/* Extracted Entities Table */}
                {selectedEvent.entities?.length > 0 && (
                  <div className="space-y-2 border-t border-slate-900 pt-4">
                    <h5 className="text-[9px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-fuchsia-400" /> Extracted Actors
                    </h5>
                    <div className="space-y-2">
                      {selectedEvent.entities.map((ent, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                          <div>
                            <div className="text-xs font-bold text-slate-200">{ent.name}</div>
                            <div className="text-[9px] text-slate-500">{ent.role}</div>
                          </div>
                          <span className={`text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded border ${ent.party === "FdI" ? "bg-red-500/10 border-red-500/20 text-red-400" : ent.party === "PD" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : ent.party === "M5S" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : ent.party === "Lega" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"}`}>
                            {ent.party}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outbound Link */}
                <div className="border-t border-slate-900 pt-4">
                  <a
                    href={selectedEvent.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-[0.98]"
                  >
                    View Original SPARQL RDF <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>

              </div>
            ) : (
              <div className="p-8 bg-slate-950/30 border border-dashed border-slate-900 rounded-xl text-center text-xs text-slate-500 italic">
                Select any timeline event to view deep legislative analytics and lobbying risks.
              </div>
            )}
          </div>

        </div>

      </div>

      {analysisModalOpen && analyzingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900/80 border border-slate-855 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col justify-between shadow-[0_0_50px_rgba(217,70,239,0.08)] glass-card relative z-50">
            
            {/* Header */}
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    In-Depth Legislative Analysis <span className="text-[9px] font-mono tracking-widest bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 px-2 py-0.5 rounded-md uppercase font-bold">OpenRouter AI</span>
                  </h3>
                  <p className="text-xs text-slate-450 truncate max-w-lg mt-0.5">Topic: {analyzingEvent.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setAnalysisModalOpen(false)}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-fuchsia-500/50 text-slate-400 hover:text-slate-100 transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto my-6 pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center text-fuchsia-400 animate-spin">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="absolute inset-0 w-12 h-12 rounded-xl border-t border-fuchsia-400 animate-ping opacity-75" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-semibold text-slate-300">
                      Drafting In-Depth Strategic Report...
                    </p>
                    <p className="text-xs text-slate-500 max-w-md">
                      Interfacing with DeepSeek via OpenRouter to analyze strategic parliamentary coalition impacts, extract political party motives, and formulate corporate GR risk advisory recommendations.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line space-y-4 pr-1">
                  {analysisText}
                </div>
              )}
            </div>

            {/* Footer Controls */}
            <div className="border-t border-slate-800 pt-4 flex gap-3 justify-end flex-wrap">
              <button
                onClick={copyAnalysisToClipboard}
                disabled={analyzing || !analysisText}
                className="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-fuchsia-500/50 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {copySuccess ? "✓ Copied!" : "Copy Report"}
              </button>
              <button
                onClick={downloadAnalysis}
                disabled={analyzing || !analysisText}
                className="px-5 py-2.5 rounded-xl bg-slate-955 border border-slate-800 hover:border-fuchsia-500/50 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                Save Report (.txt)
              </button>
              <button
                onClick={downloadAsPptx}
                disabled={analyzing || !analysisText || pptxGenerating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-lg shadow-fuchsia-500/10"
              >
                {pptxGenerating ? (
                  <>
                    <Activity className="w-3.5 h-3.5 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Export as PPTX
                  </>
                )}
              </button>
              <button
                onClick={() => setAnalysisModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-400 hover:to-violet-400 text-slate-950 text-xs font-black transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-fuchsia-500/10"
              >
                Close Panel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
