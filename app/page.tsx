import Link from "next/link";
import { 
  Scale, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Compass,
  Radio,
  FileText
} from "lucide-react";

export default function GatewayPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex flex-col justify-between">
      
      {/* Header & Main Container */}
      <div className="max-w-6xl w-full mx-auto space-y-10">
        
        {/* Executive Header */}
        <div className="border-b border-slate-800 pb-6 space-y-2">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md">
                Multi-Tenant Intelligence Platform
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-3">
                European Union Intelligence Portals
              </h1>
              <p className="text-xs md:text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
                Direct access to live CELLAR SPARQL legal databases, European Parliament written questions, DG COMP state-aid tracking, and Italian legislative watch.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Authorized Session
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Workspace 1: EU-Lex Explorer */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-md bg-slate-800 border border-slate-700 text-blue-400">
                  <Scale className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                  CELLAR SPARQL
                </span>
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-100">
                  EUR-Lex Directives & Case Law
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Query official EU sector legal acts, treaties, secondary legislation, and Court of Justice precedents directly via the Cellar RDF triplestore.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 mt-6">
              <Link 
                href="/eurlex"
                className="inline-flex items-center justify-between w-full px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-100 transition-colors"
              >
                <span>Launch EUR-Lex Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Workspace 2: Enel Strategic Public Affairs */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-md bg-slate-800 border border-slate-700 text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                  Brussels Hub
                </span>
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-100">
                  Enel Strategic Public Affairs
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Monitor DG COMP state aid decisions, European Parliament MEP questions, comitology votes, and generate formal corporate advocacy briefs.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 mt-6">
              <Link 
                href="/enel"
                className="inline-flex items-center justify-between w-full px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-100 transition-colors"
              >
                <span>Access Public Affairs Hub</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Workspace 3: Italian Legislative Watch */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-md bg-slate-800 border border-slate-700 text-emerald-400">
                  <Radio className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                  Rolling 60-Day Archive
                </span>
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-100">
                  Italian Political Watch
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Track Chamber and Senate floor votes, committee hearings, Openpolis political entity movements, and political news feeds twice daily.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 mt-6">
              <Link 
                href="/politics-tracker"
                className="inline-flex items-center justify-between w-full px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-100 transition-colors"
              >
                <span>Open Political Watch</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

        </div>

        {/* System Documentation & Guidance Notes */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-5 text-xs text-slate-400 space-y-3">
          <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" /> Workspace Data Protocols
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-400 text-[11px] leading-relaxed">
            <div>
              <strong className="text-slate-300 block mb-0.5">Cellar RDF SPARQL:</strong>
              Direct endpoint integration with `publications.europa.eu/webapi/rdf/sparql` supporting sector prefixes 0 through 9.
            </div>
            <div>
              <strong className="text-slate-300 block mb-0.5">Data Ingestion Cycle:</strong>
              Automated twice-daily synchronization (00:00 & 12:00 UTC) with 60-day historical data retention.
            </div>
            <div>
              <strong className="text-slate-300 block mb-0.5">Corporate Brief Generation:</strong>
              Structured analytical reporting using multi-model OpenRouter LLM orchestration and offline fallback briefing engines.
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto pt-8 mt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
        <div>EU Legal & Public Affairs Intelligence Portal &copy; 2026</div>
        <div className="flex items-center gap-6">
          <Link href="/eurlex" className="hover:text-slate-300 transition-colors">EUR-Lex</Link>
          <Link href="/enel" className="hover:text-slate-300 transition-colors">Enel Hub</Link>
          <Link href="/politics-tracker" className="hover:text-slate-300 transition-colors">Italian Watch</Link>
        </div>
      </div>

    </div>
  );
}
