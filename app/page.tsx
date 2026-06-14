import Link from "next/link";
import { 
  Scale, 
  Zap, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Layers,
  Compass,
  Radio
} from "lucide-react";

export default function GatewayPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center relative overflow-hidden selection:bg-teal-500/30 selection:text-teal-200 p-6 md:p-12">
      
      {/* Visual background ambient pulses */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-2/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Gateway Content Wrapper */}
      <div className="max-w-5xl w-full text-center space-y-12 z-10">
        
        {/* Branding header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-slate-900/60 px-4 py-2 rounded-full border border-slate-800 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" /> Advanced EU Legal AI Gateway
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-sans uppercase tracking-tight text-white">
            European Union <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
              Intelligence Portals
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Select your strategic division workspace below. Leverage live SPARQL CELLAR queries, European Parliament APIs, and custom advocacy briefing tools.
          </p>
        </div>

        {/* Workspace Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Card 1: EU-Lex Cellar Explorer Portal */}
          <div className="group bg-slate-900/20 border border-slate-900 border-t-4 border-t-emerald-500 hover:border-emerald-500/40 rounded-3xl p-8 flex flex-col justify-between gap-8 backdrop-blur-md transition-all duration-350 hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full pointer-events-none">
              [Semantic Database Portal]
            </div>

            <div className="space-y-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/5">
                <Scale className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                EU-Lex Explorer <span className="text-[10px] font-mono tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Publications Office SPARQL</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Perform live semantic searches across binding European Union regulations, directives, decisions, and precedents directly via the official Cellar Triplestore.
              </p>
            </div>

            <Link 
              href="/eurlex"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-855 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-all active:scale-[0.98] group-hover:border-emerald-500/30"
            >
              Enter EU-Lex Explorer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Enel Strategic Public Affairs Platform */}
          <div className="group bg-slate-900/20 border border-slate-900 border-t-4 border-t-cyan-500 hover:border-cyan-500/40 rounded-3xl p-8 flex flex-col justify-between gap-8 backdrop-blur-md transition-all duration-350 hover:shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)] relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full pointer-events-none">
              [Corporate Enterprise Workspace]
            </div>

            <div className="space-y-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/5">
                <Zap className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Enel Public Affairs Hub <span className="text-[10px] font-mono tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">Brussels Strategic Watch</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated watch hub tailored for Enel's Brussels team. Monitor DG COMP state aid rules, European Parliament MEP questions, comitology votes, and generate AI advocacy briefs.
              </p>
            </div>

            <Link 
              href="/enel"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-855 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-all active:scale-[0.98] group-hover:border-cyan-500/30"
            >
              Enter Enel Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3: Italian Political Event Tracker */}
          <div className="group bg-slate-900/20 border border-slate-900 border-t-4 border-t-fuchsia-500 hover:border-fuchsia-500/40 rounded-3xl p-8 flex flex-col justify-between gap-8 backdrop-blur-md transition-all duration-350 hover:shadow-[0_0_50px_-12px_rgba(217,70,239,0.15)] relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full pointer-events-none">
              [Civic Watch Portal]
            </div>

            <div className="space-y-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shrink-0 shadow-lg shadow-fuchsia-500/5">
                <Radio className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Italian Policy Watch <span className="text-[10px] font-mono tracking-wider bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 px-2 py-0.5 rounded-full">Roma Live Tracker</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monitor Italian legislative acts, Senate and Chamber votes, Openpolis public figures movement logs, and Italian political news aggregates on a rolling 60-day watch timeline.
              </p>
            </div>

            <Link 
              href="/politics-tracker"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-855 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-all active:scale-[0.98] group-hover:border-fuchsia-500/30"
            >
              Enter Italian Tracker <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        {/* Footer Badge */}
        <div className="pt-6 flex justify-center items-center gap-6 text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> SECURE ADVOCACY SESSION</span>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <span className="flex items-center gap-1.5"><Compass className="w-4 h-4 text-cyan-400" /> MULTI-TENANT ROUTING ENABLED</span>
        </div>

      </div>
    </div>
  );
}
