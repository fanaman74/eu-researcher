# Layout Reorganization & Section Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the dashboard sections, integrate tactile category/sector selector bubbles inside the main Search Console header, relocate the depth slider, and style all sections with premium glowing borders and floating glass badges to ensure excellent visual demarcation.

**Architecture:** Refactor the page modules inside `app/page.tsx` to shift layouts, replace the select dropdown with dynamic state-backed category pills using custom HSL colors, and inject top border highlights and absolute badges.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, Lucide Icons.

---

### Task 1: Demarcate Luxembourg Live Feed (Section 1)

**Files:**
- Modify: `app/page.tsx` (Live Feed container styling)

- [ ] **Step 1: Apply visual accent top-border, mesh shadows, and floating badge to Section 1**
  
  Locate the wrapper `div` of SECTION 1 (`Luxembourg Live Feed`) in `app/page.tsx` around line 569:
  ```tsx
  <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl backdrop-blur-md relative overflow-hidden">
  ```
  And replace it with:
  ```tsx
  <div className="bg-slate-900/20 border border-slate-800/80 border-t-4 border-t-emerald-500 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] backdrop-blur-md relative overflow-hidden">
  ```
  And inject the absolute-positioned floating glass badge directly inside the container as the very first child:
  ```tsx
  {/* Floating glass badge */}
  <div className="absolute top-4 right-4 md:top-6 md:right-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none z-10">
    [01 / Luxembourg Live Feed]
  </div>
  ```

- [ ] **Step 2: Verify compiling**
  
  Run: `npm run build`
  Expected: Success without errors.

- [ ] **Step 3: Commit Section 1 changes**
  
  ```bash
  git add app/page.tsx
  git commit -m "style: apply visual demarcation and floating badge to Section 1"
  ```

---

### Task 2: Simplify Status & Presets (Section 2)

**Files:**
- Modify: `app/page.tsx` (Connection status and search presets container)

- [ ] **Step 1: Simplify Section 2 container structure and style with Cyan accents**
  
  Locate the wrapper `div` of SECTION 2 (`Research Parameters`) in `app/page.tsx` around line 671:
  ```tsx
  <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl backdrop-blur-md relative overflow-hidden">
  ```
  Replace it with:
  ```tsx
  <div className="bg-slate-900/20 border border-slate-800/80 border-t-4 border-t-cyan-500 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)] backdrop-blur-md relative overflow-hidden">
  ```
  Inject the absolute-positioned floating badge at the top-right:
  ```tsx
  {/* Floating glass badge */}
  <div className="absolute top-4 right-4 md:top-6 md:right-8 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none z-10">
    [02 / System & Presets]
  </div>
  ```
  Change the section title header to "System Status & Presets Overview":
  ```tsx
  <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
    System Status & Presets <span className="text-[10px] font-mono tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded-full">Dashboard Info</span>
  </h2>
  ```

- [ ] **Step 2: Clean settings grid layout**
  
  Remove the entire "Target Settings Card" block (lines 720-763) from Section 2's inner grid since it is being relocated. Reorganize the grid layout from a 3-column to a 2-column horizontal grid (`grid-cols-1 md:grid-cols-3` -> `grid-cols-1 lg:grid-cols-3` where Status Card takes `lg:col-span-1` and Presets Card takes `lg:col-span-2`):
  ```tsx
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
    {/* Status Panel Card (Takes 1 column) */}
    <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
      ...
    </div>

    {/* Presets Card (Takes 2 columns) */}
    <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
      ...
    </div>
  </div>
  ```

- [ ] **Step 3: Verify build**
  
  Run: `npm run build`
  Expected: Success without errors.

- [ ] **Step 4: Commit Section 2 refactoring**
  
  ```bash
  git add app/page.tsx
  git commit -m "refactor: simplify Section 2 layout and apply Cyan accent demarcation"
  ```

---

### Task 3: Refactor Search Console Header with Category Bubbles (Section 3)

**Files:**
- Modify: `app/page.tsx` (Search Console header, category bubbles, and depth slider)

- [ ] **Step 1: Apply purple visual accents and absolute badge to Section 3**
  
  Locate the wrapper `div` of SECTION 3 (`Interactive Search Console`) in `app/page.tsx` around line 789:
  ```tsx
  <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl backdrop-blur-md relative overflow-hidden">
  ```
  Replace it with:
  ```tsx
  <div className="bg-slate-900/20 border border-slate-800/80 border-t-4 border-t-purple-500 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_-12px_rgba(168,85,247,0.15)] backdrop-blur-md relative overflow-hidden">
  ```
  Inject the absolute-positioned floating purple badge:
  ```tsx
  {/* Floating glass badge */}
  <div className="absolute top-4 right-4 md:top-6 md:right-8 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none z-10">
    [03 / Search & Config Console]
  </div>
  ```

- [ ] **Step 2: Add category bubble buttons row and full-width depth range slider directly inside the Search Console header**
  
  Directly below the title header element (after line 806), inject the visual selector pills array and full-width depth slider inside Section 3:
  ```tsx
  {/* Interactive Category/Sector Selector Bubbles & Config Toolbar */}
  <div className="space-y-6 border-b border-slate-850 pb-6 relative z-10">
    
    {/* Sector Pills */}
    <div className="space-y-2">
      <label className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> Targeted Legal Sectors & Domains
      </label>
      <div className="flex flex-wrap gap-2.5">
        {[
          { id: "case_law", label: "Case Law (Sector 6)", color: "emerald" },
          { id: "statutes", label: "Secondary Legislation (Sector 3)", color: "cyan" },
          { id: "regulatory", label: "Preparatory Documents (Sector 5)", color: "indigo" },
          { id: "international", label: "Primary Law & Treaties (Sector 1)", color: "amber" },
          { id: "consolidated", label: "Consolidated Texts (Sector 0)", color: "rose" },
          { id: "agreements", label: "International Agreements (Sector 2)", color: "violet" },
          { id: "complementary", label: "Complementary Legislation (Sector 4)", color: "blue" },
          { id: "transposition", label: "National Transposition (Sector 7)", color: "yellow" },
          { id: "national_case_law", label: "National Case-Law (Sector 8)", color: "teal" },
          { id: "parliamentary", label: "Parliamentary Questions (Sector 9)", color: "fuchsia" }
        ].map((item) => {
          const isActive = namespace === item.id;
          
          // Dynamic styles based on active/inactive states and sector colors
          let pillStyle = "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200";
          let activeBorder = "";
          
          if (isActive) {
            if (item.color === "emerald") pillStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
            else if (item.color === "cyan") pillStyle = "border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]";
            else if (item.color === "indigo") pillStyle = "border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]";
            else if (item.color === "amber") pillStyle = "border-amber-500 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]";
            else if (item.color === "rose") pillStyle = "border-rose-500 bg-rose-500/10 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]";
            else if (item.color === "violet") pillStyle = "border-violet-500 bg-violet-500/10 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]";
            else if (item.color === "blue") pillStyle = "border-blue-500 bg-blue-500/10 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]";
            else if (item.color === "yellow") pillStyle = "border-yellow-500 bg-yellow-500/10 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.1)]";
            else if (item.color === "teal") pillStyle = "border-teal-500 bg-teal-500/10 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.1)]";
            else if (item.color === "fuchsia") pillStyle = "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.1)]";
          }

          return (
            <button
              key={item.id}
              onClick={() => setNamespace(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border backdrop-blur-sm transition-all duration-350 cursor-pointer active:scale-95 flex items-center gap-1.5 ${pillStyle}`}
            >
              {isActive && (
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse bg-current`} />
              )}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>

    {/* Range Slider for depth (Sleek full-width control) */}
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
      <div className="flex flex-col gap-1 col-span-1">
        <label className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Database Search Depth (top_k)
        </label>
        <p className="text-[10px] text-slate-500 leading-none">Max matches returned for analysis</p>
      </div>
      <div className="flex items-center gap-4 col-span-2">
        <input 
          type="range"
          min="1"
          max="15"
          value={topK}
          onChange={(e) => setTopK(parseInt(e.target.value))}
          className="flex-1 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
          {topK} Documents
        </span>
      </div>
    </div>

  </div>
  ```

- [ ] **Step 3: Run project compiler**
  
  Run: `npm run build`
  Expected: Success without errors.

- [ ] **Step 4: Commit Section 3 modifications**
  
  ```bash
  git add app/page.tsx
  git commit -m "feat: integrate clickable sector selector bubbles and top_k slider in Search Console"
  ```
