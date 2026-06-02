import React, { useState } from "react";
import { 
  Radio, Search, Filter, Calendar, Sparkles, 
  ArrowRight, AlertTriangle, Layers, Database, 
  Check, RotateCcw, ExternalLink, Activity
} from "lucide-react";
import { usePoliticalEvents, PoliticalEvent } from "./hooks/usePoliticalEvents";

export default function App() {
  // 1. Initializing state filters
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [category, setCategory] = useState("");
  const [party, setParty] = useState("");
  const [days, setDays] = useState(60);
  const [selectedEvent, setSelectedEvent] = useState<PoliticalEvent | null>(null);

  // 2. Ingestion simulator drawer states
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState(false);

  // OpenRouter Analysis Modal States
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analyzingEvent, setAnalyzingEvent] = useState<PoliticalEvent | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const { events, loading, refetch } = usePoliticalEvents({
    q: search,
    sourceType,
    category,
    party,
    days
  });

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
  };

  const triggerSimulation = async (type: "camera" | "news") => {
    let payload = {};
    if (type === "camera") {
      payload = {
        title: "Chamber Committee Vote: Regional Energy Self-Sufficiency Framework",
        description: "Tenth Committee passes critical amendment protecting grid priorities for solar microgrids.",
        content: "A bipartisan majority in the Chamber's Tenth Committee voted to fast-track self-generation approvals for industrial consumers in Piedmont and Veneto. Spurred by lobbying representing domestic manufacturing interests, the amendment limits Terna's ability to defer connection licenses for distributed battery facilities.",
        sourceType: "Official",
        sourceName: "Dati Camera",
        sourceUrl: "https://dati.camera.it/ocd/votazione.rdf/v20260601-grid-edge",
        category: "Floor Vote",
        impactLevel: "High",
        entities: [{ name: "Alberto Gusmeroli", role: "Committee Chairman", party: "Lega" }],
        tags: ["Distributed Grid", "Chamber", "Self-Generation"]
      };
    } else {
      payload = {
        title: "NewsData.io: Meloni Administration Announces Strategic Tariff Caps Overhaul",
        description: "Government decrees emergency cap overrides to secure industrial energy pricing corridors.",
        content: "As reported by NewsData.io, Prime Minister Giorgia Meloni has introduced an emergency decree-law addressing retail energy tariff surges. The measure bypasses regional consultative grids to set standard grid-fee deductions for manufacturing parks.",
        sourceType: "News",
        sourceName: "NewsData.io",
        sourceUrl: "https://newsdata.io/articles/meloni-decree-tariff-infrastructure",
        category: "Political Statement",
        impactLevel: "High",
        entities: [{ name: "Giorgia Meloni", role: "Prime Minister", party: "FdI" }],
        tags: ["Tariff Cap", "State Aid", "Decarbonization"]
      };
    }

    try {
      const res = await fetch("http://localhost:5000/api/events/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSimulationSuccess(true);
        setIsSimulatorOpen(false);
        refetch();
        setTimeout(() => setSimulationSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
      {/* Visual background ambient mesh glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-2/3 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Grid Wrapper */}
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-8 z-10">
        
        {/* Navigation & Telemetry Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-6 gap-4 border-t-4 border-t-fuchsia-500 pt-4 rounded-t-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-violet-500 flex items-center justify-center text-slate-950 shadow-lg shadow-fuchsia-500/10">
              <Radio className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black font-sans uppercase tracking-tight text-white">Italian Political Watch</h1>
                <span className="text-[9px] font-mono tracking-widest bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 px-2 py-0.5 rounded-md uppercase font-bold">Roma Tracker</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Node.js, PostgreSQL & Prisma Relational Ingestion Watch Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-950 bg-fuchsia-400 hover:bg-fuchsia-350 transition-all px-4 py-2.5 rounded-xl shadow-lg shadow-fuchsia-400/10 active:scale-95 cursor-pointer"
            >
              Simulation Deck <Sparkles className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>

        {/* Dynamic Simulator Control Deck Drawer */}
        {isSimulatorOpen && (
          <div className="bg-slate-900/60 border border-fuchsia-500/20 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-fuchsia-400 flex items-center gap-2">
                <Database className="w-4 h-4" /> Relational Ingestion Simulator
              </h3>
              <button onClick={() => setIsSimulatorOpen(false)} className="text-xs text-slate-450 hover:text-white font-bold cursor-pointer">✕ Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => triggerSimulation("camera")}
                className="p-4 bg-slate-950 border border-slate-900 hover:border-fuchsia-500/40 rounded-xl text-left space-y-2 group transition-all cursor-pointer"
              >
                <div className="text-[9px] font-mono font-bold text-slate-400">Official Gov Ingestion Preset</div>
                <h4 className="text-xs font-bold text-slate-200">Chamber Vote (Regional Smart Grid)</h4>
              </button>
              <button
                onClick={() => triggerSimulation("news")}
                className="p-4 bg-slate-950 border border-slate-900 hover:border-fuchsia-500/40 rounded-xl text-left space-y-2 group transition-all cursor-pointer"
              >
                <div className="text-[9px] font-mono font-bold text-slate-400">News Ingestion Preset</div>
                <h4 className="text-xs font-bold text-slate-200">Breaking News (Tariff Reform)</h4>
              </button>
            </div>
          </div>
        )}

        {simulationSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Real-time PostgreSQL Ingestion Pipeline Active!</span>
            <span className="text-[9px] font-mono">201 CREATED</span>
          </div>
        )}

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* COLUMN 1: FILTER SYSTEM SIDEBAR */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-6 backdrop-blur-md h-fit">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-fuchsia-400" /> Filters
              </h3>
              <button onClick={handleResetFilters} className="text-[10px] text-fuchsia-400 hover:text-fuchsia-350 font-bold flex items-center gap-1 cursor-pointer">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Keyword search filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Search Keywords</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter titles, bodies..."
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                />
                <Search className="w-4 h-4 text-slate-505 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Stream sourceType */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Source Stream</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSourceType(sourceType === "Official" ? "" : "Official")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${sourceType === "Official" ? "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-300" : "bg-slate-950 border-slate-900 text-slate-400"}`}
                >
                  Official
                </button>
                <button
                  onClick={() => setSourceType(sourceType === "News" ? "" : "News")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${sourceType === "News" ? "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-300" : "bg-slate-950 border-slate-900 text-slate-400"}`}
                >
                  News
                </button>
              </div>
            </div>

            {/* Categories select dropdown */}
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
              </select>
            </div>

            {/* Party select pills */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Key Party Involved</label>
              <div className="grid grid-cols-3 gap-1.5">
                {["FdI", "PD", "M5S", "Lega", "FI"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setParty(party === p ? "" : p)}
                    className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${party === p ? "bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-400" : "bg-slate-950 border-slate-900 text-slate-500"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Window depth slider */}
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
            </div>
          </div>

          {/* COLUMN 2 & 3: DYNAMIC TIMELINE STREAM */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4.5 h-4.5 text-fuchsia-400 animate-pulse" /> Rolling Policy Stream ({events.length})
              </h3>
            </div>

            {loading ? (
              <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-12 text-center text-xs text-slate-405">
                Syncing PostgreSQL database...
              </div>
            ) : events.length === 0 ? (
              <div className="bg-slate-900/10 border border-dashed border-slate-900 rounded-3xl p-12 text-center text-slate-500 italic text-xs">
                No active events matching filter criteria in the current archive.
              </div>
            ) : (
              <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                {events.map((evt) => {
                  const isSelected = selectedEvent?.id === evt.id;
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
                      className={`w-full text-left p-5 bg-slate-950 border rounded-2xl space-y-3 transition-all hover:border-slate-800 cursor-pointer duration-200 focus:outline-none focus:border-fuchsia-500/50 ${isSelected ? "border-fuchsia-500/50 bg-slate-900/40 shadow-[0_0_15px_rgba(217,70,239,0.06)]" : "border-slate-900 hover:border-slate-850"}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-405">
                          {evt.sourceName}
                        </span>
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${evt.impactLevel === "High" ? "bg-red-500/10 border-red-500/20 text-red-400" : evt.impactLevel === "Medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                          {evt.impactLevel} Impact
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-200">{evt.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{evt.description}</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-505 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(evt.date).toLocaleDateString()}
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
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMN 4: EXTRACTED AI DETAIL DRAWER */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md h-fit">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-fuchsia-400 animate-pulse" /> Relational Deep Watch
              </h3>
            </div>

            {selectedEvent ? (
              <div className="space-y-6">
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">{selectedEvent.category}</span>
                  <h4 className="text-xs font-bold text-slate-200 mt-2">{selectedEvent.title}</h4>
                </div>

                <div className="space-y-2">
                  <h5 className="text-[9px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider">Abstract</h5>
                  <p className="text-xs text-slate-350 leading-relaxed">{selectedEvent.content}</p>
                </div>

                <div className="space-y-2 border-t border-slate-900 pt-4">
                  <h5 className="text-[9px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" /> Public Affairs Risk Assessment
                  </h5>
                  <p className="text-xs text-slate-450 p-3 bg-slate-950 rounded-xl border border-slate-900">
                    {selectedEvent.impactLevel === "High" 
                      ? "🚨 CRITICAL EXPOSURE: Instantly contact lobbying directors. This event directly targets regional tariffs or grid rules."
                      : selectedEvent.impactLevel === "Medium"
                      ? "⚠️ REGULATORY ADVISORY: Potential committee threat. Prepare standard position paper updates for upcoming readings."
                      : "ℹ️ LOW WATCH: Minimal policy threat. System status nominal."}
                  </p>
                </div>

                {selectedEvent.entities?.length > 0 && (
                  <div className="space-y-2 border-t border-slate-900 pt-4">
                    <h5 className="text-[9px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Extracted Actors</h5>
                    <div className="space-y-2">
                      {selectedEvent.entities.map((ent: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                          <div>
                            <div className="text-xs font-bold text-slate-200">{ent.entity.name}</div>
                            <div className="text-[9px] text-slate-505">{ent.entity.role}</div>
                          </div>
                          <span className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded border bg-slate-900 border-slate-800 text-fuchsia-400">{ent.entity.party}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-900 pt-4">
                  <a
                    href={selectedEvent.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    View Original Source RDF <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
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
