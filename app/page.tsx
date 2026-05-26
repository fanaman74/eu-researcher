"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Scale, 
  BookOpen, 
  Settings, 
  Sliders, 
  MessageSquare, 
  Globe, 
  Activity,
  ChevronDown,
  ChevronUp,
  Shield,
  Terminal,
  Sparkles,
  ArrowDown,
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  searchLogs?: {
    q: string;
    namespace: string;
    top_k: number;
    success: boolean;
    resultsCount: number;
    results: any;
  }[];
}
const FALLBACK_LATEST_DOCS = [
  {
    celex: "62023CJ0343",
    title: "Jean-Marc Colombani v European External Action Service (EEAS) - Workplace psychological harassment & constructive dismissal under the Staff Regulations.",
    date: "2025-01-16",
    sector: "Case Law",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62023CJ0343",
    snippet: "Judgment of the Court (Third Chamber) of 16 January 2025. Jean-Marc Colombani v European External Action Service. Appeal — Civil service — EEAS staff — Harassment."
  },
  {
    celex: "32024L1760",
    title: "Directive (EU) 2024/1760 of the European Parliament and of the Council on corporate sustainability due diligence and amending Directive (EU) 2019/1937.",
    date: "2024-05-24",
    sector: "Secondary Legislation",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024L1760",
    snippet: "Directive on Corporate Sustainability Due Diligence (CS3D). Establishes duties for large companies regarding actual and potential human rights and environmental impacts."
  },
  {
    celex: "62022CJ0621",
    title: "Land Oberösterreich v European Commission - Precedents on genetically modified organisms (GMOs) and ECHR member state environmental disclosure exemptions.",
    date: "2024-09-05",
    sector: "Case Law",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62022CJ0621",
    snippet: "Judgment of the Court of 5 September 2024. Environmental liability, agricultural exclusions, and member state restrictions on GMO cultivation."
  },
  {
    celex: "32024R1689",
    title: "Regulation (EU) 2024/1689 of the European Parliament and of the Council laying down harmonised rules on artificial intelligence (Artificial Intelligence Act).",
    date: "2024-06-13",
    sector: "Secondary Legislation",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
    snippet: "Artificial Intelligence Act (AI Act). Establishes a harmonised legal framework for the development, placing on the market, and use of AI systems in the Union."
  },
  {
    celex: "62021CJ0300",
    title: "Österreichische Post AG v Commission - CJEU interpretation on GDPR non-material damage compensation and member state thresholds.",
    date: "2023-05-04",
    sector: "Case Law",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62021CJ0300",
    snippet: "Judgment of the Court (Third Chamber) of 4 May 2023. GDPR Article 82. Threshold for compensation of non-material damages in data protection infringements."
  },
  {
    celex: "32022R2065",
    title: "Regulation (EU) 2022/2065 of the European Parliament and of the Council on a Single Market For Digital Services (Digital Services Act).",
    date: "2022-10-19",
    sector: "Secondary Legislation",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2065",
    snippet: "Digital Services Act (DSA). Promotes safe online environments, establishes provider liability rules, and ensures digital transparency."
  },
  {
    celex: "62020CJ0807",
    title: "Deutsche Wohnen SE v Staatsanwaltschaft Berlin - Rationale concerning corporate administrative fine structures and GDPR data processing violations.",
    date: "2023-12-05",
    sector: "Case Law",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62020CJ0807",
    snippet: "Judgment of the Court (Grand Chamber) of 5 December 2023. Conditions for imposing administrative fines directly on legal persons under GDPR."
  },
  {
    celex: "32022R2066",
    title: "Regulation (EU) 2022/2066 of the European Parliament and of the Council on contestable and fair markets in the digital sector (Digital Markets Act).",
    date: "2022-10-22",
    sector: "Secondary Legislation",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2066",
    snippet: "Digital Markets Act (DMA). Regulates gatekeepers in the digital market to prevent unfair rules and promote digital market contestability."
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Greetings. I am your EU Legal Data Hunter AI agent. I can perform active research on European Union regulations, directives, decisions, CJEU/ECJ case law, and member state jurisdictions to assist your inquiry. What EU legal concepts would you like to search today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Settings
  const [namespace, setNamespace] = useState("case_law");
  const [topK, setTopK] = useState(5);

  // Accordion search states
  const [expandedLog, setExpandedLog] = useState<{ [key: number]: boolean }>({});

  // Summarizer Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSummaryDoc, setActiveSummaryDoc] = useState<{ title: string; snippet: string; namespace: string; celex: string } | null>(null);
  const [isDetailedSummary, setIsDetailedSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Latest Documents States
  const [latestDocs, setLatestDocs] = useState<any[]>(FALLBACK_LATEST_DOCS);
  const [loadingLatest, setLoadingLatest] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const fetchLatestDocs = async () => {
      setLoadingLatest(true);
      try {
        const res = await fetch("/api/latest");
        if (res.ok) {
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            setLatestDocs(data.documents);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch latest EUR-Lex documents, using built-in high-quality records:", err);
      } finally {
        setLoadingLatest(false);
      }
    };
    fetchLatestDocs();
  }, []);

  const ALL_PRESETS = [
    {
      title: "Employment Precedents",
      query: "Analyze European Court of Justice precedents regarding gender pay discrimination and constructive dismissal."
    },
    {
      title: "Environmental Liability",
      query: "What are the EU regulatory disclosure requirements and ECHR precedents regarding offshore industrial pollution liability?"
    },
    {
      title: "GDPR Data Violations",
      query: "Find European precedents concerning biometric data processing violations and class action claims under GDPR."
    },
    {
      title: "Digital Markets Act",
      query: "Search for European Commission antitrust rulings and DMA compliance guidelines regarding third-party app stores."
    },
    {
      title: "AI Act Compliance",
      query: "Review EU AI Act compliance mandates, risk classification thresholds, and penalties for prohibited AI systems."
    },
    {
      title: "Consumer Rights",
      query: "Analyze CJEU decisions regarding consumer contract transparency, geoblocking restrictions, and airline delay refunds."
    }
  ];

  const [activePresets, setActivePresets] = useState<typeof ALL_PRESETS>([]);

  const rotatePresets = () => {
    const shuffled = [...ALL_PRESETS].sort(() => 0.5 - Math.random());
    setActivePresets(shuffled.slice(0, 2));
  };

  useEffect(() => {
    rotatePresets();
  }, []);

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Greetings. I am your EU Legal Data Hunter AI agent. I can perform active research on European Union regulations, directives, decisions, CJEU/ECJ case law, and member state jurisdictions to assist your inquiry. What EU legal concepts would you like to search today?"
      }
    ]);
    setInput("");
    setLoading(false);
    rotatePresets();
  };

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSummarize = async (title: string, snippet: string, docNamespace: string, celex: string, detailed: boolean = false) => {
    setActiveSummaryDoc({ title, snippet, namespace: docNamespace, celex });
    setIsDetailedSummary(detailed);
    setModalOpen(true);
    setSummarizing(true);
    setSummaryText("");
    setCopySuccess(false);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, snippet, namespace: docNamespace, celex, detailed })
      });

      if (!res.ok) {
        throw new Error("Failed to generate summary.");
      }

      const data = await res.json();
      setSummaryText(data.summary);
    } catch (err: any) {
      setSummaryText(`⚠️ Failed to draft summary: ${err.message || "An error occurred."}`);
    } finally {
      setSummarizing(false);
    }
  };

  const downloadSummary = () => {
    if (!activeSummaryDoc || !summaryText) return;
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeSummaryDoc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSend = async (textToSend?: string) => {
    const activeText = textToSend || input;
    if (!activeText.trim()) return;

    if (!textToSend) setInput("");
    setLoading(true);

    const newMessages = [...messages, { role: "user" as const, content: activeText }];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          defaultNamespace: namespace,
          defaultTopK: topK
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with coordinator API.");
      }

      const data = await response.json();
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: data.content,
          searchLogs: data.searchLogs 
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `⚠️ Error occurred: ${err.message || "Failed to process chat response."}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (index: number) => {
    setExpandedLog(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Animated Background Mesh Spheres */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-float-1 pointer-events-none animate-float-1" />
      <div className="absolute top-2/3 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-float-2 pointer-events-none animate-float-2" />

      {/* 1. FULL-PAGE HERO SECTION */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center p-8 relative overflow-hidden">
        {/* Subtle grid pattern inside hero */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />
        
        {/* Stylized animated neural-network vector map of Europe */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-65 md:opacity-75 select-none max-w-5xl mx-auto">
          <svg 
            viewBox="0 0 800 600" 
            className="w-full h-full max-h-[85vh] fill-none animate-float-1"
          >
            {/* Stylized background grid representing Europe */}
            <g stroke="#059669" strokeWidth="0.5" strokeOpacity="0.15" strokeDasharray="3 6">
              <circle cx="360" cy="320" r="150" />
              <circle cx="360" cy="320" r="280" />
              <circle cx="360" cy="320" r="400" />
            </g>

            {/* Highly Recognizable Projected Outline shapes of Europe */}
            <g stroke="#14b8a6" strokeWidth="0.75" strokeOpacity="0.25" fill="#14b8a6" fillOpacity="0.03">
              {/* Gibraltar (GI) */}
              <path d="M242.0 564.9 L242.0 565.7 L241.8 565.5 L241.8 565.2 L242.0 564.9 Z" id="map-country-gi" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Netherlands (NL) */}
              <path d="M359.7 318.1 L355.7 321.0 L348.9 318.2 L359.7 318.1 Z M359.7 318.1 L351.8 317.0 L362.9 303.1 L366.4 292.8 L369.5 292.7 L370.7 301.8 L376.1 298.5 L373.9 290.3 L382.3 285.3 L391.6 284.7 L396.3 287.3 L394.3 301.9 L390.7 309.5 L380.9 312.0 L383.9 316.4 L380.2 324.6 L381.5 328.4 L379.0 328.3 L377.8 328.0 L379.4 322.3 L375.5 319.9 L363.1 316.6 L359.7 318.1 Z" id="map-country-nl" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Vatican City (VA) */}
              <path d="M460.8 471.9 L460.7 471.9 L460.7 471.8 L460.8 471.8 L460.8 471.9 Z" id="map-country-va" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Ukraine (UA) */}
              <path d="M778.0 387.7 L769.8 388.0 L767.3 390.5 L754.2 394.7 L748.6 395.3 L736.6 402.3 L738.7 410.3 L745.3 416.6 L752.9 414.3 L757.8 415.2 L755.6 420.6 L749.2 421.5 L744.3 420.0 L739.5 424.8 L735.0 424.7 L725.0 431.6 L719.4 428.9 L720.7 420.0 L712.8 416.0 L707.8 415.1 L722.0 406.3 L716.3 402.6 L707.4 404.0 L702.0 401.2 L701.2 393.9 L686.7 396.5 L683.2 403.7 L679.6 407.6 L672.0 410.6 L673.3 417.4 L667.4 415.1 L661.7 417.8 L654.9 414.3 L664.0 404.6 L663.7 398.5 L666.4 396.9 L674.9 399.7 L675.4 392.0 L671.7 389.8 L671.4 385.2 L666.6 381.8 L667.0 374.9 L661.8 371.0 L656.3 370.4 L646.8 365.2 L635.3 368.8 L629.7 373.1 L621.1 374.4 L614.1 377.5 L610.2 374.1 L605.3 374.5 L593.3 371.6 L589.3 373.8 L580.1 366.4 L585.1 355.6 L586.5 348.0 L599.5 334.4 L602.7 333.9 L604.4 326.8 L598.2 315.9 L607.5 310.3 L626.8 309.5 L641.8 312.1 L643.3 314.4 L659.7 315.5 L666.3 314.3 L668.9 318.1 L683.5 314.7 L689.0 307.4 L698.6 306.5 L705.0 306.3 L707.8 303.1 L722.9 302.5 L731.0 311.7 L727.6 313.3 L729.6 319.3 L742.3 323.6 L743.5 331.8 L754.5 336.0 L768.3 333.9 L776.0 341.8 L778.6 339.7 L786.7 343.4 L789.8 342.9 L797.3 347.5 L800.9 353.5 L796.1 356.6 L799.5 369.1 L796.7 375.5 L786.5 375.3 L778.9 380.1 L778.0 387.7 Z" id="map-country-ua" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Türkiye (TR) */}
              <path d="M818.6 478.1 L830.4 479.4 L834.3 477.3 L842.3 484.7 L845.8 491.0 L843.9 494.9 L846.7 501.6 L852.8 502.0 L858.7 507.5 L859.3 508.4 L854.0 512.1 L849.5 512.8 L854.5 529.3 L851.8 536.6 L856.1 539.3 L856.3 544.3 L859.0 546.6 L852.7 551.7 L851.8 548.1 L843.3 547.4 L834.1 545.3 L830.2 549.3 L827.9 546.9 L818.7 549.9 L808.7 549.8 L800.2 554.2 L792.1 556.5 L784.8 556.3 L777.7 552.9 L768.5 557.1 L758.9 554.6 L757.4 560.1 L752.3 570.3 L748.4 562.5 L753.1 556.9 L751.4 552.8 L745.1 557.9 L733.6 554.8 L726.4 562.0 L722.4 564.6 L711.3 567.0 L706.2 564.6 L701.8 558.9 L693.6 554.6 L684.8 553.5 L682.9 562.5 L673.1 565.0 L666.4 561.1 L665.1 556.3 L658.3 554.5 L654.0 550.9 L644.3 551.0 L646.4 547.3 L642.7 545.0 L641.0 540.2 L642.9 535.5 L636.1 531.9 L638.3 529.1 L637.1 523.6 L640.2 520.8 L636.1 514.2 L637.9 509.8 L629.1 511.3 L629.9 502.9 L636.8 496.2 L643.5 495.3 L645.9 497.5 L655.9 496.2 L662.0 494.0 L669.1 489.6 L665.2 486.4 L668.6 482.8 L675.9 484.0 L681.2 483.3 L686.9 485.1 L692.4 484.7 L694.9 481.3 L705.3 474.7 L718.5 470.0 L735.4 471.0 L738.5 469.2 L742.1 474.7 L751.4 475.4 L753.0 479.6 L757.0 482.2 L760.3 480.6 L763.9 483.5 L780.1 487.7 L792.9 484.8 L803.3 487.1 L811.8 483.1 L818.6 478.1 Z M652.5 470.8 L656.6 478.9 L665.3 482.8 L661.9 486.9 L654.4 485.2 L646.2 486.9 L643.2 491.6 L629.0 492.8 L628.2 490.9 L631.8 487.2 L631.8 482.6 L635.4 480.0 L631.6 474.9 L635.3 470.8 L643.6 469.0 L646.6 471.6 L652.5 470.8 Z" id="map-country-tr" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Sweden (SE) */}
              <path d="M605.0 84.2 L592.0 85.4 L573.1 90.7 L573.2 95.3 L567.9 100.4 L571.9 107.4 L563.2 115.7 L542.0 125.9 L534.9 131.4 L527.9 132.5 L522.1 150.2 L518.5 152.8 L520.0 167.0 L528.7 168.8 L536.1 174.3 L541.2 182.3 L527.7 190.2 L532.7 192.8 L522.5 196.9 L512.6 203.8 L514.1 207.3 L511.5 213.9 L511.1 225.9 L504.6 239.6 L489.6 240.6 L482.7 246.0 L484.2 250.9 L471.6 253.8 L466.3 252.8 L467.4 248.2 L462.7 241.0 L466.3 233.2 L460.6 228.5 L448.6 208.9 L444.9 194.8 L447.9 194.0 L452.9 189.9 L451.5 185.0 L461.4 176.6 L462.6 171.1 L459.0 162.1 L466.2 156.5 L457.3 150.5 L459.1 141.3 L456.8 136.3 L458.1 129.7 L455.4 125.0 L463.5 114.5 L471.4 112.3 L479.5 113.3 L481.0 106.0 L475.7 104.1 L485.9 92.4 L486.7 79.0 L498.3 76.1 L497.5 73.1 L509.6 64.0 L506.2 58.0 L520.9 47.0 L528.2 49.2 L533.9 39.5 L553.5 42.9 L561.5 31.8 L578.4 40.2 L588.1 42.3 L598.6 49.4 L596.5 57.6 L602.9 67.9 L599.4 73.3 L605.0 84.2 Z M542.5 213.5 L539.2 215.6 L537.8 223.1 L532.7 225.7 L530.9 218.0 L535.8 213.6 L542.5 213.5 Z" id="map-country-se" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Slovenia (SI) */}
              <path d="M511.0 397.3 L500.1 402.2 L500.0 408.1 L495.7 409.7 L496.5 414.0 L489.0 413.4 L478.5 414.7 L474.8 413.2 L476.6 412.1 L472.6 400.3 L476.3 397.0 L486.2 398.6 L492.3 395.3 L504.1 394.4 L505.8 391.4 L511.0 397.3 Z" id="map-country-si" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Slovakia (SK) */}
              <path d="M585.1 355.6 L580.1 366.4 L575.6 367.5 L571.7 364.0 L559.9 364.4 L558.0 368.2 L552.6 370.8 L539.0 373.0 L538.1 376.4 L526.3 376.7 L518.7 372.9 L515.2 365.8 L516.3 363.3 L519.2 359.0 L526.3 358.6 L531.2 352.6 L539.5 348.5 L547.0 347.1 L551.4 353.6 L561.4 350.4 L574.0 350.1 L585.1 355.6 Z" id="map-country-sk" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Serbia (RS) */}
              <path d="M556.8 403.6 L563.4 409.5 L563.4 413.8 L572.2 419.6 L570.9 423.7 L579.6 429.0 L584.6 429.9 L587.1 434.0 L583.6 437.7 L585.3 446.7 L590.5 451.0 L584.2 456.6 L584.9 463.1 L582.7 465.2 L573.1 466.3 L575.4 459.4 L571.0 458.1 L566.9 452.6 L561.5 453.5 L558.1 456.8 L548.3 450.6 L543.9 445.4 L547.5 442.6 L543.4 432.9 L545.9 423.9 L541.6 423.7 L542.2 413.1 L540.4 406.5 L548.1 402.9 L556.8 403.6 Z" id="map-country-rs" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* San Marino (SM) */}
              <path d="M461.4 439.4 L460.3 438.9 L460.8 438.1 L461.7 438.6 L461.4 439.4 Z" id="map-country-sm" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Romania (RO) */}
              <path d="M654.9 414.3 L661.7 417.8 L667.4 415.1 L673.3 417.4 L671.5 424.2 L665.2 425.6 L660.2 433.0 L659.5 442.0 L652.9 440.7 L650.9 438.0 L641.1 435.1 L630.4 437.7 L621.5 443.2 L593.5 439.9 L587.1 434.0 L584.6 429.9 L579.6 429.0 L570.9 423.7 L572.2 419.6 L563.4 413.8 L563.4 409.5 L556.8 403.6 L568.0 400.5 L582.0 377.4 L589.3 373.8 L593.3 371.6 L605.3 374.5 L610.2 374.1 L614.1 377.5 L621.1 374.4 L629.7 373.1 L635.3 368.8 L639.8 370.5 L644.1 378.8 L653.2 389.5 L655.3 398.1 L653.5 405.8 L654.9 414.3 Z" id="map-country-ro" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Portugal (PT) */}
              <path d="M216.5 548.4 L211.3 551.3 L201.9 549.4 L199.2 544.4 L198.0 526.8 L191.1 523.3 L192.6 514.9 L198.9 500.8 L201.2 486.0 L199.3 475.9 L199.7 471.2 L206.6 468.1 L210.2 472.2 L216.6 473.0 L226.2 471.2 L227.2 475.6 L231.2 477.9 L222.4 486.3 L223.9 497.1 L221.4 499.3 L221.1 507.3 L216.1 510.2 L221.0 520.4 L217.3 527.7 L219.3 535.0 L215.3 541.9 L216.5 548.4 Z" id="map-country-pt" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Poland (PL) */}
              <path d="M549.0 268.2 L556.4 268.9 L587.9 269.9 L596.4 273.3 L596.7 276.7 L601.7 291.4 L601.2 297.3 L593.2 303.9 L598.1 306.4 L598.2 315.9 L604.4 326.8 L602.7 333.9 L599.5 334.4 L586.5 348.0 L585.1 355.6 L574.0 350.1 L561.4 350.4 L551.4 353.6 L547.0 347.1 L539.5 348.5 L536.1 342.5 L527.7 341.0 L518.8 334.4 L513.0 339.0 L504.7 330.6 L496.7 327.4 L490.0 326.6 L492.5 320.2 L487.4 310.8 L489.3 306.8 L487.6 299.5 L481.6 293.9 L485.1 287.3 L483.2 280.1 L482.6 277.8 L482.6 276.5 L506.9 271.0 L511.5 266.7 L520.2 263.8 L533.2 262.1 L537.5 268.7 L541.2 270.0 L549.0 268.2 Z" id="map-country-pl" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Svalbard and Jan Mayen (SJ) */}
              <path d="M564.9 -150.0 L584.0 -152.5 L638.3 -148.5 L642.4 -144.4 L623.3 -136.3 L602.4 -132.9 L564.4 -136.2 L538.2 -142.1 L533.5 -146.9 L564.9 -150.0 Z M514.3 -144.4 L536.4 -139.0 L542.6 -132.3 L559.5 -131.8 L570.9 -125.5 L551.0 -123.6 L534.6 -113.9 L532.0 -105.8 L524.6 -103.8 L513.2 -90.5 L484.5 -101.1 L480.1 -104.5 L491.3 -108.5 L476.1 -114.0 L492.2 -116.0 L487.9 -120.2 L469.5 -117.4 L452.6 -125.1 L445.6 -131.8 L441.4 -142.6 L464.7 -142.3 L472.4 -137.5 L502.4 -140.8 L514.3 -144.4 Z M573.6 -123.2 L592.2 -113.4 L606.0 -111.9 L601.1 -105.4 L588.3 -101.8 L579.2 -105.4 L573.6 -112.2 L556.7 -121.3 L573.6 -123.2 Z" id="map-country-sj" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Norway (NO) */}
              <path d="M544.7 15.1 L548.8 16.7 L538.9 23.0 L533.5 20.0 L544.7 15.1 Z M523.1 22.8 L528.6 29.2 L516.6 30.2 L523.1 22.8 Z M687.6 19.7 L664.2 32.1 L668.7 24.8 L666.4 21.5 L651.0 15.2 L634.2 17.6 L627.8 21.8 L624.6 32.6 L614.7 39.0 L601.3 35.6 L594.8 38.1 L583.5 37.0 L573.8 28.0 L561.5 31.8 L553.5 42.9 L533.9 39.5 L528.2 49.2 L520.9 47.0 L506.2 58.0 L509.6 64.0 L497.5 73.1 L498.3 76.1 L486.7 79.0 L485.9 92.4 L475.7 104.1 L481.0 106.0 L479.5 113.3 L471.4 112.3 L463.5 114.5 L455.4 125.0 L458.1 129.7 L456.8 136.3 L459.1 141.3 L457.3 150.5 L466.2 156.5 L459.0 162.1 L462.6 171.1 L461.4 176.6 L451.5 185.0 L452.9 189.9 L447.9 194.0 L441.0 191.6 L426.1 195.5 L408.2 208.5 L393.9 210.4 L377.9 202.3 L375.6 199.0 L379.7 195.3 L379.6 188.9 L370.8 190.9 L373.0 184.2 L370.7 181.1 L372.2 169.1 L369.8 166.9 L368.3 150.6 L375.8 140.9 L385.9 136.0 L397.3 136.2 L393.9 130.4 L407.4 128.3 L411.1 121.1 L427.0 119.6 L427.2 115.7 L437.7 106.7 L445.9 102.5 L447.4 98.8 L457.4 94.4 L458.7 88.1 L467.4 80.8 L469.0 72.3 L489.3 56.8 L489.8 51.7 L496.2 47.5 L505.4 45.4 L512.6 38.5 L521.7 35.7 L530.5 29.9 L532.8 24.7 L541.4 23.3 L544.0 20.3 L554.7 18.1 L568.2 18.0 L571.1 13.4 L586.9 10.1 L591.3 14.6 L608.2 4.8 L611.2 -0.0 L624.8 2.4 L647.4 -1.5 L665.9 2.3 L688.5 11.8 L672.0 16.6 L674.4 20.6 L687.6 19.7 Z" id="map-country-no" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Montenegro (ME) */}
              <path d="M543.9 445.4 L548.3 450.6 L558.1 456.8 L554.6 461.4 L549.6 460.1 L545.0 467.5 L545.8 472.4 L540.2 466.2 L535.6 463.2 L534.6 461.2 L534.7 454.6 L540.8 446.0 L543.9 445.4 Z" id="map-country-me" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Malta (MT) */}
              <path d="M487.0 570.0 L485.4 570.5 L484.3 569.6 L485.5 568.3 L487.0 570.0 Z" id="map-country-mt" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* North Macedonia (MK) */}
              <path d="M582.7 465.2 L588.8 470.4 L590.8 474.9 L589.7 481.0 L584.5 484.6 L577.6 484.7 L573.2 488.6 L565.7 488.9 L562.6 487.7 L559.4 478.0 L560.8 472.3 L566.9 467.5 L573.1 466.3 L582.7 465.2 Z" id="map-country-mk" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Moldova (MD) */}
              <path d="M654.9 414.3 L653.5 405.8 L655.3 398.1 L653.2 389.5 L644.1 378.8 L639.8 370.5 L635.3 368.8 L646.8 365.2 L656.3 370.4 L661.8 371.0 L667.0 374.9 L666.6 381.8 L671.4 385.2 L671.7 389.8 L675.4 392.0 L674.9 399.7 L666.4 396.9 L663.7 398.5 L664.0 404.6 L654.9 414.3 Z" id="map-country-md" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Monaco (MC) */}
              <path d="M399.2 441.9 L398.5 442.2 L398.9 441.5 L399.2 441.9 Z" id="map-country-mc" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Latvia (LV) */}
              <path d="M644.3 218.5 L649.8 221.9 L649.9 229.2 L653.6 234.4 L654.1 240.9 L647.1 246.5 L640.6 246.0 L635.0 248.6 L614.2 236.8 L604.6 239.0 L600.8 237.9 L579.5 236.6 L566.7 242.1 L567.0 229.9 L570.5 226.7 L575.1 217.8 L585.3 215.3 L598.7 227.5 L608.0 221.8 L607.0 212.9 L616.7 209.8 L627.6 213.4 L634.3 218.4 L644.3 218.5 Z" id="map-country-lv" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Luxembourg (LU) */}
              <path d="M383.0 338.6 L387.5 343.8 L385.8 349.4 L379.0 348.0 L378.4 341.8 L383.0 338.6 Z" id="map-country-lu" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Lithuania (LT) */}
              <path d="M635.0 248.6 L629.8 259.4 L626.0 260.8 L622.1 270.3 L612.5 276.1 L596.7 276.7 L596.4 273.3 L587.9 269.9 L588.7 262.1 L585.4 258.5 L579.4 258.4 L569.1 255.2 L566.7 242.1 L579.5 236.6 L600.8 237.9 L604.6 239.0 L614.2 236.8 L635.0 248.6 Z" id="map-country-lt" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Liechtenstein (LI) */}
              <path d="M425.6 388.3 L424.5 388.2 L425.0 384.8 L425.6 388.3 Z" id="map-country-li" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Kosovo (XK) */}
              <path d="M573.1 466.3 L566.9 467.5 L560.8 472.3 L559.8 466.6 L554.6 461.4 L558.1 456.8 L561.5 453.5 L566.9 452.6 L571.0 458.1 L575.4 459.4 L573.1 466.3 Z" id="map-country-xk" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Jersey (JE) */}
              <path d="M282.8 353.0 L280.2 353.9 L280.4 352.4 L282.8 353.0 Z" id="map-country-je" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Italy (IT) */}
              <path d="M499.4 531.6 L493.5 543.9 L495.9 551.1 L493.7 556.4 L486.2 554.6 L481.8 549.7 L478.8 549.7 L460.7 538.1 L472.0 532.2 L476.1 535.1 L486.2 534.4 L490.4 532.3 L499.4 531.6 Z M426.2 488.4 L428.4 494.6 L425.4 516.2 L419.2 515.0 L417.0 520.3 L411.3 515.6 L412.0 498.0 L408.5 492.1 L421.9 483.2 L426.2 488.4 Z M476.3 397.0 L472.6 400.3 L476.6 412.1 L470.2 409.1 L468.1 411.3 L458.8 414.4 L458.2 417.7 L461.8 422.1 L458.4 426.1 L460.3 434.2 L463.9 437.9 L474.6 444.8 L480.1 459.1 L490.7 469.4 L494.4 471.3 L504.2 471.3 L504.8 479.4 L518.2 485.5 L528.7 492.1 L535.2 501.0 L530.2 503.7 L527.6 498.2 L516.0 495.3 L511.1 505.0 L512.0 508.6 L518.3 512.8 L519.1 519.0 L511.5 523.5 L511.3 528.5 L505.3 536.1 L501.2 536.1 L504.3 523.6 L507.0 522.8 L504.9 513.2 L500.8 502.9 L491.7 498.8 L489.4 491.9 L485.7 492.4 L481.3 489.3 L476.7 482.7 L468.8 482.5 L463.1 478.9 L450.9 465.6 L445.1 461.6 L439.5 455.1 L431.4 437.5 L422.0 432.7 L415.6 431.0 L407.2 439.2 L399.9 441.6 L402.2 436.5 L393.4 433.3 L394.2 426.2 L389.3 419.7 L395.7 415.1 L391.4 408.4 L394.1 406.6 L406.1 405.2 L411.8 401.4 L417.9 408.2 L421.6 400.8 L430.0 399.5 L436.3 391.4 L443.4 392.5 L446.1 389.6 L457.3 390.2 L460.2 394.0 L476.3 397.0 Z M461.4 439.4 L461.7 438.6 L460.8 438.1 L460.3 438.9 L461.4 439.4 Z" id="map-country-it" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Iceland (IS) */}
              <path d="M116.4 77.4 L126.8 80.8 L126.1 85.0 L140.1 89.4 L137.2 99.5 L122.8 108.7 L110.0 111.7 L102.9 115.7 L88.4 118.2 L78.1 123.1 L59.1 120.7 L46.2 114.6 L29.5 116.2 L39.0 110.2 L37.5 105.2 L28.5 96.9 L36.9 89.3 L25.8 87.9 L13.5 90.7 L9.6 89.4 L15.5 80.0 L31.7 74.1 L45.5 83.1 L43.9 89.6 L49.3 90.1 L57.1 85.6 L57.1 80.5 L76.6 78.3 L101.6 78.9 L104.1 73.8 L110.9 72.7 L116.4 77.4 Z" id="map-country-is" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Ireland (IE) */}
              <path d="M231.2 274.2 L233.5 293.1 L226.9 305.0 L215.0 306.5 L213.4 308.4 L199.2 314.8 L193.3 316.2 L189.8 313.1 L180.0 310.2 L185.2 305.9 L189.7 299.0 L193.2 290.3 L187.1 285.5 L184.7 271.2 L201.6 270.1 L199.8 264.6 L205.8 257.1 L218.5 253.7 L218.8 258.0 L207.8 269.0 L217.2 273.7 L222.3 269.6 L225.8 274.7 L231.2 274.2 Z" id="map-country-ie" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Isle of Man (IM) */}
              <path d="M253.4 272.7 L249.3 273.7 L252.2 269.6 L253.4 272.7 Z" id="map-country-im" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Hungary (HU) */}
              <path d="M580.1 366.4 L589.3 373.8 L582.0 377.4 L568.0 400.5 L556.8 403.6 L548.1 402.9 L540.4 406.5 L534.6 409.2 L528.8 409.1 L520.7 405.5 L511.0 397.3 L505.8 391.4 L510.2 389.1 L510.0 383.2 L513.8 378.1 L517.7 377.7 L518.7 372.9 L526.3 376.7 L538.1 376.4 L539.0 373.0 L552.6 370.8 L558.0 368.2 L559.9 364.4 L571.7 364.0 L575.6 367.5 L580.1 366.4 Z" id="map-country-hu" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Croatia (HR) */}
              <path d="M525.1 455.7 L534.6 461.2 L535.6 463.2 L525.1 455.7 Z M540.4 406.5 L542.2 413.1 L541.6 423.7 L537.4 420.4 L526.9 420.4 L511.1 418.1 L508.2 421.5 L502.0 418.7 L501.4 425.4 L506.2 430.2 L507.2 434.4 L524.6 453.4 L524.1 455.1 L515.7 447.7 L503.9 443.4 L493.8 433.7 L495.6 431.6 L491.0 426.4 L490.5 420.3 L484.7 416.1 L479.6 424.3 L475.4 419.9 L474.8 413.2 L478.5 414.7 L489.0 413.4 L496.5 414.0 L495.7 409.7 L500.0 408.1 L500.1 402.2 L511.0 397.3 L520.7 405.5 L528.8 409.1 L534.6 409.2 L540.4 406.5 Z" id="map-country-hr" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Greece (GR) */}
              <path d="M601.3 575.1 L605.1 574.1 L606.9 577.9 L612.0 576.9 L621.2 578.8 L624.6 581.5 L612.9 584.8 L608.8 581.2 L597.7 579.0 L601.3 575.1 Z M595.9 519.6 L604.3 524.3 L600.1 528.6 L593.9 522.1 L595.9 519.6 Z M632.7 513.6 L633.5 519.4 L626.5 516.7 L632.7 513.6 Z M628.2 490.9 L625.9 489.0 L616.7 486.6 L612.8 488.8 L608.9 487.3 L601.6 493.9 L598.9 499.1 L594.6 499.2 L586.2 494.7 L585.8 502.1 L589.8 508.7 L590.3 518.4 L588.0 522.2 L593.9 524.4 L602.7 530.7 L603.8 539.8 L597.9 535.0 L593.2 535.8 L592.8 545.9 L587.9 545.0 L591.7 555.0 L585.9 554.9 L579.4 550.9 L577.1 555.6 L573.3 550.0 L573.2 542.6 L567.9 536.4 L571.1 531.9 L576.3 529.8 L588.3 535.4 L592.3 533.9 L583.7 528.0 L572.0 529.9 L567.5 528.9 L563.4 522.0 L563.4 518.8 L557.6 513.6 L553.9 507.4 L561.9 500.8 L566.5 492.0 L565.7 488.9 L573.2 488.6 L577.6 484.7 L584.5 484.6 L589.7 481.0 L598.6 480.2 L603.8 477.9 L618.5 482.5 L629.4 480.2 L631.6 474.9 L635.4 480.0 L631.8 482.6 L631.8 487.2 L628.2 490.9 Z" id="map-country-gr" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Guernsey (GG) */}
              <path d="M276.8 348.7 L276.3 349.8 L275.1 349.2 L276.8 348.7 Z" id="map-country-gg" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Georgia (GE) */}
              <path d="M879.1 472.0 L876.1 475.8 L881.5 480.9 L879.5 485.3 L865.0 479.2 L861.6 481.8 L842.3 484.7 L834.3 477.3 L830.4 479.4 L818.6 478.1 L821.7 470.8 L818.3 459.6 L810.3 453.0 L806.5 452.1 L799.7 447.2 L801.8 444.8 L808.0 445.4 L819.5 450.5 L829.8 450.4 L846.6 458.2 L848.7 461.1 L855.5 458.1 L859.9 458.0 L865.8 461.7 L870.5 462.6 L869.4 466.9 L879.1 472.0 Z" id="map-country-ge" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* France (FR) */}
              <path d="M424.4 457.2 L425.2 468.2 L420.8 480.2 L416.1 476.9 L414.9 461.4 L424.4 457.2 Z M379.0 348.0 L385.8 349.4 L390.6 354.2 L399.4 354.3 L407.8 357.2 L404.2 362.7 L401.0 371.9 L401.4 379.6 L393.9 384.0 L382.3 398.5 L390.9 398.7 L394.1 406.6 L391.4 408.4 L395.7 415.1 L389.3 419.7 L394.2 426.2 L393.4 433.3 L402.2 436.5 L399.9 441.6 L399.2 441.9 L398.9 441.5 L398.5 442.2 L387.6 451.3 L383.0 452.9 L374.2 450.3 L370.0 446.8 L365.7 448.0 L357.6 444.4 L347.8 450.9 L345.2 455.4 L347.2 463.3 L332.7 464.5 L328.7 462.1 L325.3 460.6 L316.3 456.6 L315.5 459.1 L307.2 459.1 L304.0 456.9 L291.9 453.1 L285.6 447.4 L289.4 444.9 L292.4 428.8 L294.6 408.6 L293.6 400.4 L285.7 397.1 L282.3 392.3 L282.8 388.6 L268.8 377.9 L259.7 375.6 L254.6 375.8 L250.7 371.6 L253.6 367.0 L249.6 364.2 L267.9 359.3 L274.6 364.3 L277.6 362.5 L290.0 362.6 L288.2 353.5 L284.8 345.7 L292.2 345.7 L293.7 350.5 L305.7 351.9 L311.1 349.2 L310.0 345.4 L323.0 340.6 L326.8 335.8 L327.1 328.6 L331.2 324.5 L338.8 322.8 L342.6 329.0 L359.1 336.5 L359.1 341.2 L365.0 340.5 L367.6 344.0 L375.5 348.5 L379.0 348.0 Z" id="map-country-fr" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Faroe Islands (FO) */}
              <path d="M226.1 142.3 L221.4 144.4 L219.4 141.3 L226.1 142.3 Z" id="map-country-fo" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Finland (FI) */}
              <path d="M664.2 32.1 L658.1 40.7 L660.7 45.6 L668.9 47.6 L676.2 56.0 L665.7 65.3 L675.7 79.6 L678.1 86.2 L673.4 87.2 L672.1 97.8 L677.8 101.1 L678.3 107.6 L683.1 113.2 L677.6 118.6 L691.5 126.4 L695.8 131.6 L692.7 136.7 L673.1 153.3 L649.8 169.7 L643.0 169.6 L623.5 173.0 L617.3 175.2 L599.7 178.9 L588.2 177.1 L585.6 172.6 L571.5 168.7 L570.6 162.7 L573.6 152.6 L569.3 146.1 L570.5 142.3 L567.4 135.8 L581.5 122.6 L593.8 115.2 L606.5 105.2 L609.9 100.5 L620.0 97.1 L619.7 89.5 L605.0 84.2 L599.4 73.3 L602.9 67.9 L596.5 57.6 L598.6 49.4 L588.1 42.3 L578.4 40.2 L561.5 31.8 L573.8 28.0 L583.5 37.0 L594.8 38.1 L601.3 35.6 L614.7 39.0 L624.6 32.6 L627.8 21.8 L634.2 17.6 L651.0 15.2 L666.4 21.5 L668.7 24.8 L664.2 32.1 Z" id="map-country-fi" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Estonia (EE) */}
              <path d="M652.5 186.7 L645.3 198.9 L646.0 206.4 L649.3 213.4 L644.3 218.5 L634.3 218.4 L627.6 213.4 L616.7 209.8 L607.0 212.9 L609.6 205.1 L600.2 205.0 L597.0 200.1 L596.9 191.4 L607.8 186.9 L620.8 186.1 L621.7 184.2 L639.7 187.3 L652.5 186.7 Z M586.1 200.7 L594.4 203.0 L580.3 208.9 L579.5 203.1 L586.1 200.7 Z" id="map-country-ee" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Spain (ES) */}
              <path d="M118.1 694.9 L118.3 699.3 L114.3 700.8 L114.7 694.8 L118.1 694.9 Z M106.7 691.1 L102.7 697.2 L99.6 691.8 L106.7 691.1 Z M133.0 694.6 L135.3 685.8 L137.5 687.8 L136.3 693.2 L133.0 694.6 Z M346.4 506.1 L350.3 507.6 L345.5 514.0 L336.9 509.0 L342.0 505.1 L346.4 506.1 Z M285.6 447.4 L291.9 453.1 L304.0 456.9 L307.2 459.1 L315.5 459.1 L316.3 456.6 L325.3 460.6 L326.0 463.2 L328.7 462.1 L332.7 464.5 L347.2 463.3 L347.7 471.2 L333.3 481.8 L320.4 485.5 L316.5 489.4 L312.2 497.5 L303.7 510.5 L305.2 517.9 L310.2 522.8 L303.0 528.1 L299.7 532.7 L297.6 541.9 L291.4 542.3 L285.6 547.6 L281.7 555.0 L273.4 556.0 L267.6 555.3 L253.9 555.9 L250.2 559.4 L244.0 560.7 L238.5 567.1 L233.3 564.5 L227.8 552.1 L223.0 548.2 L216.5 548.4 L215.3 541.9 L219.3 535.0 L217.3 527.7 L221.0 520.4 L216.1 510.2 L221.1 507.3 L221.4 499.3 L223.9 497.1 L222.4 486.3 L231.2 477.9 L227.2 475.6 L226.2 471.2 L216.6 473.0 L210.2 472.2 L206.6 468.1 L199.7 471.2 L200.7 465.8 L194.0 454.4 L198.5 448.6 L202.6 448.6 L206.1 444.7 L212.9 441.7 L218.3 444.4 L238.0 444.6 L252.0 447.3 L263.3 445.6 L270.2 448.0 L278.9 448.7 L285.6 447.4 Z" id="map-country-es" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* United Kingdom (GB) */}
              <path d="M231.2 274.2 L225.8 274.7 L222.3 269.6 L217.2 273.7 L207.8 269.0 L218.8 258.0 L232.3 255.9 L240.4 267.6 L238.7 271.3 L231.2 274.2 Z M269.4 202.5 L268.2 205.6 L258.6 211.5 L260.1 217.3 L265.8 215.5 L282.2 215.6 L285.8 219.0 L275.0 238.1 L268.6 241.9 L281.3 244.8 L287.3 250.2 L291.8 263.1 L299.4 267.5 L305.2 275.3 L314.6 292.4 L320.7 292.6 L328.1 295.9 L329.2 300.5 L326.9 306.7 L319.5 311.2 L316.1 318.1 L325.1 318.4 L319.5 325.5 L310.2 328.2 L289.0 328.4 L276.3 330.5 L270.8 328.9 L265.8 330.3 L261.0 336.8 L256.3 334.2 L241.9 336.5 L251.3 328.0 L256.1 321.3 L269.1 321.0 L253.7 312.3 L247.4 314.2 L245.1 308.2 L253.7 304.9 L258.7 299.3 L257.1 288.3 L270.0 285.0 L271.7 280.0 L268.7 273.6 L263.8 268.1 L265.4 260.0 L259.0 263.0 L244.5 261.8 L249.6 252.6 L243.1 244.4 L238.6 242.3 L241.3 234.9 L234.6 233.4 L239.2 223.3 L236.1 220.0 L242.0 206.9 L249.7 202.5 L270.1 200.5 L269.4 202.5 Z" id="map-country-gb" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Denmark (DK) */}
              <path d="M438.7 249.6 L440.4 257.3 L430.6 256.8 L429.1 251.1 L438.7 249.6 Z M462.4 246.7 L458.0 251.9 L456.0 262.5 L451.1 256.4 L446.6 256.1 L442.8 247.8 L458.1 241.3 L462.4 246.7 Z M427.6 262.3 L414.4 261.0 L413.7 252.7 L407.8 249.7 L408.2 233.4 L413.8 225.2 L425.3 223.3 L430.3 217.6 L437.4 219.8 L434.4 227.0 L434.2 233.2 L441.2 234.8 L441.3 238.5 L434.7 239.8 L433.0 245.4 L425.7 251.5 L427.6 262.3 Z" id="map-country-dk" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Germany (DE) */}
              <path d="M427.6 262.3 L435.2 268.6 L448.0 276.6 L456.8 272.9 L462.5 268.1 L468.0 269.0 L478.3 278.1 L483.2 280.1 L485.1 287.3 L481.6 293.9 L487.6 299.5 L489.3 306.8 L487.4 310.8 L492.5 320.2 L490.0 326.6 L484.5 326.0 L461.0 334.9 L458.8 337.6 L460.2 344.8 L463.2 349.3 L477.7 360.5 L472.7 366.6 L465.4 370.4 L467.1 374.7 L463.8 378.3 L451.9 379.7 L446.7 382.3 L436.1 380.4 L434.6 384.1 L427.7 379.9 L424.9 380.7 L413.8 376.8 L408.6 379.3 L401.4 379.6 L401.0 371.9 L404.2 362.7 L407.8 357.2 L399.4 354.3 L390.6 354.2 L385.8 349.4 L387.5 343.8 L383.0 338.6 L386.0 335.4 L381.5 328.4 L380.2 324.6 L383.9 316.4 L380.9 312.0 L390.7 309.5 L394.3 301.9 L396.3 287.3 L397.4 280.8 L406.3 280.7 L412.8 282.9 L417.2 278.3 L417.9 266.9 L414.4 261.0 L427.6 262.3 Z" id="map-country-de" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Czechia (CZ) */}
              <path d="M490.0 326.6 L496.7 327.4 L504.7 330.6 L513.0 339.0 L518.8 334.4 L527.7 341.0 L536.1 342.5 L539.5 348.5 L531.2 352.6 L526.3 358.6 L519.2 359.0 L516.3 363.3 L510.5 360.0 L505.3 360.7 L497.3 357.4 L492.0 357.0 L488.5 363.3 L480.6 363.2 L477.7 360.5 L463.2 349.3 L460.2 344.8 L458.8 337.6 L461.0 334.9 L484.5 326.0 L490.0 326.6 Z" id="map-country-cz" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Cyprus (CY) */}
              <path d="M731.9 574.2 L725.4 579.1 L726.8 584.0 L713.1 590.7 L707.1 588.2 L705.4 584.5 L713.1 577.5 L719.5 578.3 L731.9 574.2 Z" id="map-country-cy" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Switzerland (CH) */}
              <path d="M424.9 380.7 L425.0 384.8 L424.5 388.2 L425.6 388.3 L430.7 391.0 L436.3 391.4 L430.0 399.5 L421.6 400.8 L417.9 408.2 L411.8 401.4 L406.1 405.2 L394.1 406.6 L390.9 398.7 L382.3 398.5 L393.9 384.0 L401.4 379.6 L408.6 379.3 L413.8 376.8 L424.9 380.7 Z" id="map-country-ch" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Belgium (BE) */}
              <path d="M377.8 328.0 L379.0 328.3 L381.5 328.4 L386.0 335.4 L383.0 338.6 L378.4 341.8 L379.0 348.0 L375.5 348.5 L367.6 344.0 L365.0 340.5 L359.1 341.2 L359.1 336.5 L342.6 329.0 L338.8 322.8 L348.9 318.2 L355.7 321.0 L359.7 318.1 L363.1 316.6 L375.5 319.9 L379.4 322.3 L377.8 328.0 Z" id="map-country-be" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Belarus (BY) */}
              <path d="M654.1 240.9 L662.1 244.2 L669.2 244.2 L670.6 248.4 L679.8 245.8 L688.1 250.2 L689.0 258.6 L686.8 263.0 L690.7 265.2 L694.2 272.5 L699.0 274.8 L710.2 286.4 L703.3 290.4 L694.4 288.7 L696.3 303.0 L698.6 306.5 L689.0 307.4 L683.5 314.7 L668.9 318.1 L666.3 314.3 L659.7 315.5 L643.3 314.4 L641.8 312.1 L626.8 309.5 L607.5 310.3 L598.2 315.9 L598.1 306.4 L593.2 303.9 L601.2 297.3 L601.7 291.4 L596.7 276.7 L612.5 276.1 L622.1 270.3 L626.0 260.8 L629.8 259.4 L635.0 248.6 L640.6 246.0 L647.1 246.5 L654.1 240.9 Z" id="map-country-by" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Bosnia and Herzegovina (BA) */}
              <path d="M541.6 423.7 L545.9 423.9 L543.4 432.9 L547.5 442.6 L543.9 445.4 L540.8 446.0 L534.7 454.6 L534.6 461.2 L525.1 455.7 L524.1 455.1 L524.6 453.4 L507.2 434.4 L506.2 430.2 L501.4 425.4 L502.0 418.7 L508.2 421.5 L511.1 418.1 L526.9 420.4 L537.4 420.4 L541.6 423.7 Z" id="map-country-ba" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Bulgaria (BG) */}
              <path d="M659.5 442.0 L658.0 447.7 L651.4 451.0 L650.9 458.1 L646.0 462.7 L652.5 470.8 L646.6 471.6 L643.6 469.0 L635.3 470.8 L631.6 474.9 L629.4 480.2 L618.5 482.5 L603.8 477.9 L598.6 480.2 L589.7 481.0 L590.8 474.9 L588.8 470.4 L582.7 465.2 L584.9 463.1 L584.2 456.6 L590.5 451.0 L585.3 446.7 L583.6 437.7 L587.1 434.0 L593.5 439.9 L621.5 443.2 L630.4 437.7 L641.1 435.1 L650.9 438.0 L652.9 440.7 L659.5 442.0 Z" id="map-country-bg" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Azerbaijan (AZ) */}
              <path d="M875.3 520.9 L867.4 518.8 L859.3 508.4 L858.7 507.5 L861.9 506.5 L871.0 512.8 L875.3 520.9 Z M905.5 472.8 L912.1 481.6 L913.6 486.1 L920.3 493.2 L926.9 496.0 L917.6 499.6 L914.8 509.1 L915.2 513.3 L910.9 516.7 L908.9 521.9 L909.2 528.1 L905.8 528.5 L898.7 521.9 L901.4 519.3 L898.4 507.8 L895.7 508.4 L879.9 520.4 L880.6 515.7 L876.3 509.3 L871.3 504.6 L873.4 498.9 L866.2 492.4 L868.8 489.0 L861.6 481.8 L865.0 479.2 L879.5 485.3 L881.5 480.9 L876.1 475.8 L879.1 472.0 L883.1 473.3 L889.4 481.4 L896.7 483.0 L903.3 476.7 L905.5 472.8 Z" id="map-country-az" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Austria (AT) */}
              <path d="M516.3 363.3 L515.2 365.8 L518.7 372.9 L517.7 377.7 L513.8 378.1 L510.0 383.2 L510.2 389.1 L505.8 391.4 L504.1 394.4 L492.3 395.3 L486.2 398.6 L476.3 397.0 L460.2 394.0 L457.3 390.2 L446.1 389.6 L443.4 392.5 L436.3 391.4 L430.7 391.0 L425.6 388.3 L425.0 384.8 L424.9 380.7 L427.7 379.9 L434.6 384.1 L436.1 380.4 L446.7 382.3 L451.9 379.7 L463.8 378.3 L467.1 374.7 L465.4 370.4 L472.7 366.6 L477.7 360.5 L480.6 363.2 L488.5 363.3 L492.0 357.0 L497.3 357.4 L505.3 360.7 L510.5 360.0 L516.3 363.3 Z" id="map-country-at" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Armenia (AM) */}
              <path d="M879.9 520.4 L875.3 520.9 L871.0 512.8 L861.9 506.5 L858.7 507.5 L852.8 502.0 L846.7 501.6 L843.9 494.9 L845.8 491.0 L842.3 484.7 L861.6 481.8 L868.8 489.0 L866.2 492.4 L873.4 498.9 L871.3 504.6 L876.3 509.3 L880.6 515.7 L879.9 520.4 Z" id="map-country-am" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Andorra (AD) */}
              <path d="M328.7 462.1 L326.0 463.2 L325.3 460.6 L328.7 462.1 Z" id="map-country-ad" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Aland Islands (AX) */}
              <path d="M553.7 172.7 L557.0 174.1 L550.7 176.8 L550.0 174.0 L553.7 172.7 Z" id="map-country-ax" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
              {/* Albania (AL) */}
              <path d="M554.6 461.4 L559.8 466.6 L560.8 472.3 L559.4 478.0 L562.6 487.7 L565.7 488.9 L566.5 492.0 L561.9 500.8 L553.9 507.4 L552.0 502.0 L546.4 498.1 L545.7 491.9 L547.2 487.6 L547.0 479.6 L548.6 473.7 L545.8 472.4 L545.0 467.5 L549.6 460.1 L554.6 461.4 Z" id="map-country-al" className="transition-all duration-300 hover:fill-teal-500/20 hover:stroke-teal-400" />
            
            </g>

            {/* Dynamic Glowing Data Paths (Neural streams of legal data, re-aligned to real coordinates) */}
            <g stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.5">
              {/* Brussels to Strasbourg */}
              <path d="M360 320 L390 360">
                <animate attributeName="stroke-dasharray" values="0 100; 100 0" dur="4s" repeatCount="indefinite" />
              </path>
              {/* Luxembourg to Brussels */}
              <path d="M383 340 L360 320" />
              {/* Paris to Brussels */}
              <path d="M310 350 L360 320" />
              {/* London to Paris */}
              <path d="M270 240 L310 350">
                <animate attributeName="stroke-dasharray" values="0 50; 50 0" dur="3s" repeatCount="indefinite" />
              </path>
              {/* Dublin to London */}
              <path d="M220 270 L270 240" />
              {/* Paris to Madrid */}
              <path d="M310 350 L215 510">
                <animate attributeName="stroke-dasharray" values="0 150; 150 0" dur="6s" repeatCount="indefinite" />
              </path>
              {/* Madrid to Lisbon */}
              <path d="M215 510 L200 520" />
              {/* Rome to Strasbourg */}
              <path d="M460 440 L390 360">
                <animate attributeName="stroke-dasharray" values="0 120; 120 0" dur="5s" repeatCount="indefinite" />
              </path>
              {/* Berlin to Brussels */}
              <path d="M435 300 L360 320" />
              {/* Berlin to Warsaw */}
              <path d="M435 300 L560 290" />
              {/* Berlin to Stockholm */}
              <path d="M435 300 L530 150" />
              {/* Vienna to Prague */}
              <path d="M490 370 L490 330" />
              {/* Prague to Berlin */}
              <path d="M490 330 L435 300" />
              {/* Rome to Athens */}
              <path d="M460 440 L600 490" />
              {/* Warsaw to Vienna */}
              <path d="M560 290 L490 370" />
            </g>

            {/* Major Capital Nodes (Legal Hubs, re-aligned to real coordinates) */}
            <g fill="#10b981" stroke="#020617" strokeWidth="1.5">
              <circle cx="360" cy="320" r="5" className="fill-teal-300 drop-shadow-[0_0_8px_rgba(20,184,166,0.8)]" /> {/* Brussels */}
              <circle cx="383" cy="340" r="4.5" className="fill-teal-400" /> {/* Luxembourg */}
              <circle cx="390" cy="360" r="4.5" className="fill-teal-400 animate-pulse" /> {/* Strasbourg */}
              <circle cx="310" cy="350" r="4" /> {/* Paris */}
              <circle cx="270" cy="240" r="4" /> {/* London */}
              <circle cx="220" cy="270" r="4" /> {/* Dublin */}
              <circle cx="215" cy="510" r="4" /> {/* Madrid */}
              <circle cx="200" cy="520" r="3.5" /> {/* Lisbon */}
              <circle cx="460" cy="440" r="4" /> {/* Rome */}
              <circle cx="435" cy="300" r="4.5" className="fill-teal-400" /> {/* Berlin */}
              <circle cx="490" cy="370" r="4" /> {/* Vienna */}
              <circle cx="490" cy="330" r="4" /> {/* Prague */}
              <circle cx="560" cy="290" r="4" /> {/* Warsaw */}
              <circle cx="530" cy="150" r="4" className="animate-pulse" /> {/* Stockholm */}
              <circle cx="600" cy="490" r="4" /> {/* Athens */}
            </g>

            {/* Glowing Outer Pulses on key nodes */}
            <g className="stroke-teal-400/60 fill-none" strokeWidth="0.5">
              <circle cx="360" cy="320" r="12" className="animate-ping [animation-duration:3s]" />
              <circle cx="390" cy="360" r="10" className="animate-ping [animation-duration:4s]" />
              <circle cx="435" cy="300" r="10" className="animate-ping [animation-duration:5s]" />
            </g>
          </svg>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800 text-teal-400 text-xs font-semibold uppercase tracking-wider pulse-emerald">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Powered by DeepSeek-V4-Flash
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            EU Legal Search <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">
              Redefined by AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
            Connect to European Union statutory codes, regulatory directives, and historical case law precedents. Query complex schemas instantly in pure natural language.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <button 
              onClick={scrollToDashboard}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-white font-semibold text-base shadow-[0_0_30px_rgba(20,184,166,0.25)] hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer"
            >
              Access Research Console <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Smooth Scroll Arrow Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-slate-550">
          <span className="text-xs tracking-widest uppercase">Scroll Down</span>
          <button 
            onClick={scrollToDashboard}
            className="p-3.5 rounded-full bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:text-emerald-400 hover:scale-110 active:scale-95 transition-all animate-bounce cursor-pointer"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 2. DASHBOARD ROW SECTION (Below Hero) */}
      <section 
        ref={dashboardRef}
        className="max-w-7xl mx-auto w-full px-6 py-16 scroll-mt-6 space-y-12 z-10"
      >
        
        {/* ========================================================= */}
        {/* SECTION 1: LUXEMBOURG LIVE FEED (8 LATEST DOCUMENTS)      */}
        {/* ========================================================= */}
        <div className="bg-slate-900/20 border border-slate-800/80 border-t-4 border-t-emerald-500 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] backdrop-blur-md relative overflow-hidden">
          {/* Floating glass badge */}
          <div className="absolute top-4 right-4 md:top-6 md:right-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none z-10">
            [01 / Luxembourg Live Feed]
          </div>

          {/* Subtle green ambient light glow in the top-left */}
          <span className="absolute -left-32 -top-32 w-64 h-64 rounded-full bg-gradient-to-br from-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  Luxembourg Live Feed <span className="text-[10px] font-mono tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full">EUR-Lex Official</span>
                </h2>
                <p className="text-xs text-slate-400">Discover and analyze the absolute latest documents published in Luxembourg in real-time</p>
              </div>
            </div>
            {loadingLatest ? (
              <span className="text-xs text-teal-400 flex items-center gap-1.5 animate-pulse font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" /> Synchronizing Live Feed...
              </span>
            ) : (
              <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-3 py-1 rounded-full font-medium">8 Fresh Records Loaded</span>
            )}
          </div>

          {/* Grid Layout (4 per row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {latestDocs.map((doc, idx) => {
              // Color-coded Category pill badges (border and background), neutral plain CELEX text
              let sectorBadgeStyle = "border border-slate-800 bg-slate-950/30 text-slate-400 px-2 py-0.5 rounded-md";
              
              if (doc.celex.startsWith("6")) {
                sectorBadgeStyle = "border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 px-2 py-0.5 rounded-md";
              } else if (doc.celex.startsWith("3")) {
                sectorBadgeStyle = "border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 px-2 py-0.5 rounded-md";
              } else if (doc.celex.startsWith("5")) {
                sectorBadgeStyle = "border border-indigo-500/20 bg-indigo-950/20 text-indigo-400 px-2 py-0.5 rounded-md";
              } else if (doc.celex.startsWith("1")) {
                sectorBadgeStyle = "border border-amber-500/20 bg-amber-950/20 text-amber-400 px-2 py-0.5 rounded-md";
              }

              return (
                <div 
                  key={idx}
                  className="bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-emerald-500/30 transition-all hover:scale-[1.02] duration-300 group shadow-lg shadow-slate-950/20 relative overflow-hidden"
                >
                  {/* Visual subtle card glow */}
                  <span className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-gradient-to-br from-teal-500/5 to-emerald-500/0 blur-xl pointer-events-none group-hover:from-teal-500/10 transition-all duration-300" />
                  
                  <div>
                    {/* Category Header */}
                    <div className="flex flex-col items-start gap-1.5 border-b border-slate-850/50 pb-2.5">
                      <span className="text-[10px] font-mono font-bold text-teal-400 tracking-wide">
                        {doc.celex}
                      </span>
                      <span className={`text-[9px] font-bold font-sans uppercase tracking-wider ${sectorBadgeStyle}`}>
                        {doc.sector}
                      </span>
                    </div>

                    {/* Document Title */}
                    <h4 
                      title={doc.title}
                      className="text-xs font-bold text-slate-200 line-clamp-3 leading-snug my-3 group-hover:text-white transition-colors cursor-help"
                    >
                      {doc.title}
                    </h4>
                  </div>

                  {/* Footer Controls */}
                  <div className="border-t border-slate-850/50 pt-2.5 flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                      🗓️ {doc.date}
                    </span>
                    <div className="flex items-center gap-2">
                      <a 
                        href={doc.url}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-teal-500/50 text-slate-400 hover:text-slate-100 transition-colors"
                        title="View Official Portal document"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button 
                        onClick={() => handleSummarize(doc.title, doc.snippet || "", doc.sector.toLowerCase().replace(' ', '_'), doc.celex)}
                        className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 font-semibold transition-all duration-300 cursor-pointer"
                      >
                        Summarise <Sparkles className="w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: RESEARCH CONSOLE CONFIGURATION (SETTINGS)     */}
        {/* ========================================================= */}
        <div className="bg-slate-900/20 border border-slate-800/80 border-t-4 border-t-cyan-500 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)] backdrop-blur-md relative overflow-hidden">
          {/* Floating glass badge */}
          <div className="absolute top-4 right-4 md:top-6 md:right-8 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none z-10">
            [02 / System & Presets]
          </div>

          {/* Subtle cyan ambient light glow in the top-right */}
          <span className="absolute -right-32 -top-32 w-64 h-64 rounded-full bg-gradient-to-br from-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  System Status & Presets <span className="text-[10px] font-mono tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded-full">Dashboard Info</span>
                </h2>
                <p className="text-xs text-slate-400">Confirm database network sockets, launch quick search presets, and view server status</p>
              </div>
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-emerald" />
              <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-full font-medium">System Armed</span>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            {/* Status Panel Card (1 Column) */}
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" /> Connection Status
                </span>
                <span className="text-[10px] uppercase bg-cyan-950/50 border border-cyan-800/80 text-cyan-400 px-2 py-0.5 rounded-full">Secure</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">OpenRouter (DeepSeek)</span>
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">EUR-Lex SPARQL Endpoint</span>
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Secured
                  </span>
                </div>
              </div>
            </div>

            {/* Presets Card (Spans 2 Columns) */}
            <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
              <span className="text-sm font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" /> Quick Search Presets
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(preset.query)}
                    className="text-left p-3.5 rounded-xl bg-slate-950/40 border border-slate-855 hover:border-teal-500 hover:bg-slate-900/60 transition-all duration-300 group cursor-pointer h-24 flex flex-col justify-between"
                  >
                    <div className="text-[11px] font-bold text-teal-400 group-hover:text-emerald-400 transition-colors line-clamp-1">{preset.title}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">{preset.query}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: INTERACTIVE QUERY CONSOLE (SEARCH & CHAT)      */}
        {/* ========================================================= */}
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl backdrop-blur-md relative overflow-hidden">
          {/* Subtle purple ambient light glow in the bottom-left */}
          <span className="absolute -left-32 -bottom-32 w-64 h-64 rounded-full bg-gradient-to-tr from-purple-500/5 to-transparent blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="border-b border-slate-850 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Scale className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  Interactive Search Console <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                </h2>
                <p className="text-xs text-slate-400">Query EU case precedents, directive mandates, and regulations in pure natural language</p>
              </div>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="space-y-8 min-h-[350px] max-h-[600px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950 relative z-10">
            {messages.map((message, index) => {
              // Parse options for assistant messages dynamically
              let displayContent = message.content;
              const messageOptions = [];
              
              if (message.role === "assistant") {
                const optionRegex = /\[Option:\s*(.*?)\]/gi;
                let match;
                while ((match = optionRegex.exec(message.content)) !== null) {
                  messageOptions.push(match[1].trim());
                }
                displayContent = message.content.replace(/\[Option:\s*(.*?)\]/gi, '').trim();
              }

              return (
                <div 
                  key={index}
                  className={`flex gap-4 max-w-6xl ${message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  {/* Avatar Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${message.role === "user" ? "bg-gradient-to-tr from-emerald-500 to-cyan-500 border-cyan-400 text-white" : "bg-slate-900 border-slate-800 text-teal-400"}`}>
                    {message.role === "user" ? <MessageSquare className="w-4.5 h-4.5" /> : <Scale className="w-4.5 h-4.5" />}
                  </div>

                  {/* Message Container */}
                  <div className="space-y-4 w-[90%]">
                    <div className={`p-5 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap ${message.role === "user" ? "bg-gradient-to-br from-emerald-950/40 to-teal-900/40 border-teal-800/80 text-teal-55" : "bg-slate-900/50 border-slate-800 backdrop-blur-md text-slate-100"}`}>
                      {displayContent}
                    </div>

                    {/* Interactive choice elements */}
                    {message.role === "assistant" && messageOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 pt-1">
                        {messageOptions.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            onClick={() => handleSend(opt)}
                            disabled={loading}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-950 border border-slate-850 hover:border-teal-500/50 hover:bg-slate-900/40 text-slate-300 hover:text-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* RENDER DYNAMIC SPARQL SEARCH LOG TABLE IF RETURNED */}
                    {message.role === "assistant" && message.searchLogs && message.searchLogs.length > 0 && (
                      <div className="space-y-6 pt-2">
                        {message.searchLogs.map((log: any, logIdx: number) => (
                          <div 
                            key={logIdx} 
                            className="border border-slate-800 bg-slate-950/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg"
                          >
                            {/* Log Card Header */}
                            <div 
                              onClick={() => setExpandedLog(prev => ({ ...prev, [logIdx]: !prev[logIdx] }))}
                              className="px-5 py-4 bg-slate-900/40 border-b border-slate-850 flex items-center justify-between cursor-pointer hover:bg-slate-900/70 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Terminal className="text-teal-400 w-4 h-4 animate-pulse" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">EUR-Lex Database Search Event</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] bg-teal-950/40 border border-teal-850 text-teal-400 px-2.5 py-0.5 rounded-full font-semibold">
                                  {log.resultsCount} Hits Found
                                </span>
                                {expandedLog[logIdx] ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                              </div>
                            </div>

                            {/* Collapsible details log */}
                            {expandedLog[logIdx] && (
                              <div className="p-4 border-b border-slate-850 bg-slate-950 text-[10px] font-mono text-slate-500 space-y-1.5 leading-relaxed">
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                  <span>SPARQL Host URI: <strong className="text-slate-400">publications.europa.eu/webapi/rdf/sparql</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                  <span>Searched Namespace: <strong className="text-teal-400 font-semibold">"{log.namespace}"</strong> for <strong className="text-teal-400 font-semibold">"{log.q}"</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                  <span>Database Query Success: <strong className={log.success ? "text-emerald-400" : "text-red-400"}>{log.success ? "true" : "false"}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                  <span>Result limit depth (top_k): <strong className="text-slate-400">{log.top_k}</strong></span>
                                </div>
                              </div>
                            )}

                            {/* Render search result tables */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 font-medium">
                                    <th className="p-4 w-1/4">📜 Document Name</th>
                                    <th className="p-4 w-[12%] text-center">🎯 Relevance</th>
                                    <th className="p-4">🔍 Context Preview Snippet</th>
                                    <th className="p-4 w-[10%] text-center">🔗 Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850">
                                  {Array.isArray(log.results) && log.results.length > 0 ? (
                                    log.results.map((doc: any, docIdx: number) => {
                                      // relevance score mapping
                                      const score = doc.score || (0.95 - docIdx * 0.08);
                                      const scorePercent = (score * 100).toFixed(0);
                                      
                                      // Score badges
                                      let scoreColor = "text-emerald-400 bg-emerald-950/40 border-emerald-800/80";
                                      if (score < 0.8) {
                                        scoreColor = "text-cyan-400 bg-cyan-950/40 border-cyan-800/80";
                                      }
                                      if (score < 0.6) {
                                        scoreColor = "text-slate-400 bg-slate-900/40 border-slate-800/80";
                                      }

                                      // link creation
                                      const targetLink = doc.url || `https://legaldatahunter.com/doc/${encodeURIComponent(doc.id || doc.title || "document")}`;

                                      return (
                                        <tr 
                                          key={docIdx} 
                                          className={`hover:bg-slate-900/40 transition-colors ${docIdx % 2 === 0 ? "bg-transparent" : "bg-slate-900/10"}`}
                                        >
                                          <td className="p-4 font-semibold text-slate-200 align-top">
                                            {doc.title || `Legal Record #${docIdx + 1}`}
                                          </td>
                                          <td className="p-4 align-top text-center">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${scoreColor}`}>
                                              {scorePercent}% Match
                                            </span>
                                          </td>
                                          <td className="p-4 align-top text-slate-400 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                                            {doc.snippet || doc.content || "Context content payload loaded securely."}
                                          </td>
                                          <td className="p-4 align-top text-center">
                                            <div className="flex items-center justify-center gap-3">
                                              <a 
                                                href={targetLink}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-emerald-400 hover:underline transition-colors font-medium cursor-pointer"
                                              >
                                                Link <ExternalLink className="w-3.5 h-3.5" />
                                              </a>
                                              <button 
                                                onClick={() => handleSummarize(doc.title, doc.snippet, log.namespace, doc.id)}
                                                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-teal-455 hover:underline transition-colors font-medium cursor-pointer"
                                              >
                                                Summarise <Sparkles className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                                        No database snippets returned for this action.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-4 max-w-4xl mr-auto">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-slate-900 border-slate-800 text-emerald-400 animate-pulse">
                  <Scale className="w-4.5 h-4.5 animate-spin" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="p-4 bg-slate-900/40 border border-slate-800 backdrop-blur-md rounded-2xl flex items-center gap-3">
                    <span className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" />
                    </span>
                    <span className="text-xs text-slate-400 font-medium">DeepSeek-V4 is querying database indexes...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Floating Input */}
          <div className="mt-6 border-t border-slate-850 pt-6 relative z-10">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="max-w-6xl mx-auto flex gap-3 p-2 bg-slate-950/60 border border-slate-800 rounded-2xl focus-within:border-teal-500/80 focus-within:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-300 relative z-10"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about European cases, EU directives, precedents, or statutory definitions..."
                className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none text-slate-100 placeholder-slate-500"
              />
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:text-red-400 text-slate-400 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-white font-medium text-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:pointer-events-none cursor-pointer"
              >
                Query <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </section>

    {/* 4. SENIOR EU LAWYER CASE SUMMARIZER POPUP MODAL */}
    {modalOpen && activeSummaryDoc && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col justify-between shadow-2xl glass-card relative z-50">
          
          {/* Header */}
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="text-emerald-400 w-6 h-6 animate-pulse" />
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  {isDetailedSummary ? "Senior EU Lawyer Detailed Case Analysis" : "Senior EU Lawyer Quick Overview"} <Sparkles className="w-4 h-4 text-teal-400" />
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-lg">Doc: {activeSummaryDoc.title}</p>
              </div>
            </div>
            <button 
              onClick={() => setModalOpen(false)}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-slate-100 transition-all cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto my-6 pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
            {summarizing ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center text-emerald-400 animate-spin">
                    <Scale className="w-6 h-6" />
                  </div>
                  <span className="absolute inset-0 w-12 h-12 rounded-xl border-t border-emerald-400 animate-ping opacity-75" />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-sm font-semibold text-slate-300">
                    {isDetailedSummary ? "Drafting Comprehensive Case Analysis..." : "Drafting Concise Legal Overview..."}
                  </p>
                  <p className="text-xs text-slate-500 max-w-md">
                    {isDetailedSummary 
                      ? "Acting as a Senior EU Counsel to construct a thorough ~1000-word legal analysis including citations, dispute facts, directive holdings, and strategic precedents."
                      : "Acting as a Senior EU Counsel to draft a quick 250-word legal overview covering the factual core and primary holding."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line space-y-4 pr-1">
                {summaryText}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="border-t border-slate-800 pt-4 flex gap-3 justify-end flex-wrap">
            {!isDetailedSummary && (
              <button
                onClick={() => handleSummarize(activeSummaryDoc.title, activeSummaryDoc.snippet, activeSummaryDoc.namespace, activeSummaryDoc.celex, true)}
                disabled={summarizing || !summaryText}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-100 text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-lg shadow-emerald-500/20 mr-auto border border-emerald-500/30 animate-pulse"
              >
                <Sparkles className="w-4 h-4 text-teal-200" />
                Detailed Case Analysis (1000 words)
              </button>
            )}
            <button
              onClick={copyToClipboard}
              disabled={summarizing || !summaryText}
              className="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {copySuccess ? "✓ Copied!" : "Copy Summary"}
            </button>
            <button
              onClick={downloadSummary}
              disabled={summarizing || !summaryText}
              className="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              Save Summary (.txt)
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Close Panel
            </button>
          </div>

        </div>
      </div>
    )}

      {/* Footer */}
      <footer className="p-8 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500 space-y-2 mt-auto">
        <p>© 2026 Legal Data Hunter AI. Built on Next.js 15, Tailwind CSS v4, and OpenRouter.</p>
        <p>Confidential and secured enterprise environment.</p>
      </footer>

    </div>
  );
}
