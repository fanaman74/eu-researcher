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
  Radio,
  ExternalLink,
  ChevronRight,
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

  // Analysis Modal States
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analyzingEvent, setAnalyzingEvent] = useState<PoliticalEvent | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [pptxGenerating, setPptxGenerating] = useState(false);

  // Refresh & Sync States
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
        if (data.events?.length > 0) {
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate public affairs analysis.");
      }

      setAnalysisText(data.analysis || "No report generated.");
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
        category: "Floor Vote",
        impactLevel: "High",
        entities: [
          { name: "Gilberto Pichetto Fratin", party: "FI", role: "Minister of Environment" },
          { name: "Matteo Salvini", party: "Lega", role: "Minister of Infrastructure" }
        ],
        tags: ["Microgrids", "Chamber", "Self-Sufficiency", "Licensing"]
      };
    } else if (preset === "news-data") {
      payload = {
        title: "NewsData.io: Cabinet Approves Emergency Decree on Industrial Tariff Cap Extensions",
        description: "Council of Ministers signs off on €1.8B buffer package extending energy tax mitigation measures through Q4 2026.",
        content: "During an emergency late-night session in Palazzo Chigi, the Council of Ministers authorized a targeted emergency decree shielding energy-intensive manufacturing clusters. The measure temporarily freezes grid capacity surcharges for electro-chemical and manufacturing facilities. Initial analysis shows strong alignment with Enel's industrial retail division recommendations, although parliamentary conversion debates are expected to trigger amendments from M5S regarding financing sources.",
        sourceType: "News",
        sourceName: "NewsData.io",
        category: "Corporate Regulation",
        impactLevel: "High",
        entities: [
          { name: "Giorgia Meloni", party: "FdI", role: "Prime Minister" },
          { name: "Giancarlo Giorgetti", party: "Lega", role: "Minister of Economy" }
        ],
        tags: ["Tariff Cap", "Cabinet Decree", "State Aid", "Tax Relief"]
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-8">
        
        {/* Navigation Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md transition-colors"
            >
              ← Gateway
            </Link>
            <div className="w-10 h-10 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Italian Political Watch</h1>
                <span className="text-[10px] font-mono tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-semibold">
                  Rome Archive
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">National legislative movements, official committee votes, and policy aggregations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono font-medium text-slate-300">Auto-Refresh: 2x/Day (00:00 & 12:00)</span>
            </div>
            <button
              onClick={handleSyncData}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors px-3 py-1.5 rounded-md cursor-pointer disabled:opacity-50"
              title={lastRefreshed ? `Last refreshed: ${lastRefreshed.toLocaleTimeString()}` : "Trigger twice-daily data refresh"}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-400" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Live Data"}</span>
            </button>
            <button
              onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-100 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors px-3 py-1.5 rounded-md cursor-pointer"
            >
              <span>Simulation Deck</span> <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            </button>
          </div>
        </div>

        {/* Ingestion Simulator Drawer Panel */}
        {isSimulatorOpen && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" /> Ingestion Pipeline Simulator
              </h3>
              <button 
                onClick={() => setIsSimulatorOpen(false)}
                className="text-xs text-slate-400 hover:text-white font-semibold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inject custom political events directly into the rolling database to test timeline updates and filter state logic.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <button
                onClick={() => handleSimulateIngestion("camera-vote")}
                disabled={simulationLoading}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-md text-left space-y-2 group transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">Preset: Chamber Committee</span>
                  <PlusCircle className="w-4 h-4 text-blue-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Ingest Committee Vote (Renewables)</h4>
                <p className="text-[11px] text-slate-400">Simulates legislative voting in Rome committee sessions.</p>
              </button>
              <button
                onClick={() => handleSimulateIngestion("news-data")}
                disabled={simulationLoading}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-md text-left space-y-2 group transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">Preset: NewsData.io Aggregator</span>
                  <PlusCircle className="w-4 h-4 text-blue-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Ingest Breaking Energy Policy Decrees</h4>
                <p className="text-[11px] text-slate-400">Simulates real-time Italian media coverage of cabinet decrees.</p>
              </button>
            </div>
          </div>
        )}

        {simulationSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-md flex items-center justify-between">
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Real-time Ingestion Successful! Event added to rolling archive.</span>
            <span className="text-[10px] font-mono">200 OK</span>
          </div>
        )}

        {/* Dashboard 4-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* COLUMN 1: CONTROLS & FILTERING */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-6 h-fit">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-400" /> Filter Archive
              </h3>
              <button 
                onClick={handleResetFilters}
                className="text-[10px] text-slate-400 hover:text-slate-200 font-mono transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Keyword Search */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Keyword Search</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search decree, entity, tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-md pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 transition-colors outline-none"
                />
              </div>
            </div>

            {/* Source Type Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Source Category</label>
              <select 
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-md px-3 py-2 text-xs text-slate-200 transition-colors outline-none cursor-pointer"
              >
                <option value="">All Sources (Official + News)</option>
                <option value="Official">Official (Dati Camera/Senato, Openpolis)</option>
                <option value="News">News Aggregators (NewsData, Event Registry)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Event Classification</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-md px-3 py-2 text-xs text-slate-200 transition-colors outline-none cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="Floor Vote">Floor Vote</option>
                <option value="Committee Meeting">Committee Meeting</option>
                <option value="Political Statement">Political Statement</option>
                <option value="Corporate Regulation">Corporate Regulation</option>
                <option value="Legislative Act">Legislative Act</option>
              </select>
            </div>

            {/* Party Alignment Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Political Party</label>
              <select 
                value={party}
                onChange={(e) => setParty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-md px-3 py-2 text-xs text-slate-200 transition-colors outline-none cursor-pointer"
              >
                <option value="">All Factions</option>
                <option value="FdI">Fratelli d'Italia (FdI)</option>
                <option value="Lega">Lega</option>
                <option value="FI">Forza Italia (FI)</option>
                <option value="PD">Partito Democratico (PD)</option>
                <option value="M5S">Movimento 5 Stelle (M5S)</option>
              </select>
            </div>

            {/* Time Window Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-slate-300">Retention Window</span>
                <span className="font-mono text-blue-400">{days} Days</span>
              </div>
              <input 
                type="range"
                min="1"
                max="60"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-slate-800 rounded-md appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>7 days</span>
                <span>30 days</span>
                <span>60 days</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2 & 3: POLICY TIMELINE STREAM */}
          <div className="lg:col-span-2 flex flex-col h-[700px] gap-4">
            <div className="flex justify-between items-center px-1 shrink-0">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-400" /> Rolling Legislative Feed ({events.length})
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Order: Chronological</span>
            </div>

            {loading ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-12 text-center flex flex-col items-center justify-center gap-3 flex-1">
                <Radio className="w-6 h-6 text-blue-400 animate-spin" />
                <span className="text-xs text-slate-400">Loading Rome legislative records...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-lg p-12 text-center text-slate-400 text-xs flex-1 flex flex-col items-center justify-center">
                No active events match the filter criteria in the current {days}-day archive.
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
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
                      className={`w-full text-left p-4 rounded-lg space-y-3 transition-colors cursor-pointer border ${
                        isSelected 
                          ? "bg-slate-900 border-blue-500/60" 
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                            {evt.sourceName}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                            {evt.category}
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                          evt.impactLevel === "High" 
                            ? "bg-red-500/10 border-red-500/20 text-red-400" 
                            : evt.impactLevel === "Medium" 
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                              : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}>
                          {evt.impactLevel} Impact
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 leading-snug">
                        {evt.title}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> {eventDate}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="flex gap-1">
                            {evt.tags.slice(0, 2).map((t, idx) => (
                              <span key={idx} className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 border border-slate-800">#{t}</span>
                            ))}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyzeEvent(evt);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors font-semibold text-[10px] cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" /> Analyze
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMN 4: DEEP EXTRACTION PANEL */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 h-[700px] flex flex-col justify-between gap-4">
            <div className="shrink-0 border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" /> Policy Briefing & Extraction
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Selected event metadata & legislative links</p>
            </div>

            {selectedEvent ? (
              <div className="space-y-5 overflow-y-auto pr-1 flex-1 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Selected Event Title</span>
                  <h4 className="font-bold text-slate-100 text-sm leading-snug">{selectedEvent.title}</h4>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Full Summary</span>
                  <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-md border border-slate-800">
                    {selectedEvent.content}
                  </p>
                </div>

                {/* Political Entities Involved */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Sponsoring Entities / Key Actors</span>
                  {selectedEvent.entities && selectedEvent.entities.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedEvent.entities.map((ent, idx) => (
                        <div key={idx} className="p-2 bg-slate-950 border border-slate-800 rounded-md flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-200 block text-[11px]">{ent.name}</span>
                            <span className="text-[10px] text-slate-500">{ent.role}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            {ent.party}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-[11px]">No specific individual actors linked.</p>
                  )}
                </div>

                {/* Action Trigger */}
                <div className="pt-2">
                  <button
                    onClick={() => handleAnalyzeEvent(selectedEvent)}
                    className="w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate In-Depth Public Affairs Report
                  </button>
                </div>

                {/* External Link */}
                {selectedEvent.sourceUrl && (
                  <div className="pt-2 border-t border-slate-800">
                    <a
                      href={selectedEvent.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      <span>View Official Source Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 text-xs italic">
                Select any event from the timeline feed to view extraction metadata.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Analysis Report Modal */}
      {analysisModalOpen && analyzingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 md:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col justify-between shadow-2xl relative">
            
            {/* Header */}
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    In-Depth Legislative Analysis Report
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-lg mt-0.5">Topic: {analyzingEvent.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setAnalysisModalOpen(false)}
                className="p-1.5 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto my-6 pr-2">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Radio className="w-7 h-7 text-blue-400 animate-spin" />
                  <p className="text-sm font-semibold text-slate-300">
                    Generating Strategic Public Affairs Report...
                  </p>
                  <p className="text-xs text-slate-500 max-w-md text-center">
                    Analyzing parliamentary party alignments, regulatory risks, and actionable lobbying recommendations.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line space-y-4 pr-1">
                  {analysisText}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 pt-4 flex gap-3 justify-end flex-wrap">
              <button
                onClick={copyAnalysisToClipboard}
                disabled={analyzing || !analysisText}
                className="px-4 py-2 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {copySuccess ? "✓ Copied!" : "Copy Report"}
              </button>
              <button
                onClick={downloadAnalysis}
                disabled={analyzing || !analysisText}
                className="px-4 py-2 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Save (.txt)
              </button>
              <button
                onClick={downloadAsPptx}
                disabled={analyzing || !analysisText || pptxGenerating}
                className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {pptxGenerating ? "Generating..." : "Export PPTX"}
              </button>
              <button
                onClick={() => setAnalysisModalOpen(false)}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
