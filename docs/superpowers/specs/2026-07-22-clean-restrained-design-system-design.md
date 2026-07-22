# Clean Restrained Design System Architecture Specification

## 1. Executive Overview
This design specification defines the overhaul of the **EU-Researcher Platform** visual UI design system. It eliminates generic "AI slop" anti-patterns (neon glow effects, multi-colored pink/purple gradient backgrounds, glassmorphism overloads, oversized 30px pill cards, decorative floating blobs, floating animations, and centered paragraph stacks) in favor of a clean, restrained, high-density **Editorial Corporate Intelligence Portal**.

---

## 2. Design System Tokens & Guidelines

### 2.1 Color Palette
- **Canvas / Page Background**: Deep Charcoal Slate (`#0b0f19` / `bg-slate-950`)
- **Surface / Container Background**: Dark Slate (`#131a27` / `bg-slate-900`)
- **Card / Input Background**: Subdued Slate (`#1a2332` / `bg-slate-900/70`)
- **Border / Divider**: Hairline Slate (`#263346` / `border-slate-800`)
- **Primary Text**: Off-White (`#f3f4f6` / `text-slate-100`)
- **Secondary Text / Metadata**: Neutral Gray (`#9ca3af` / `text-slate-400`)
- **Muted Text**: Subdued Slate (`#6b7280` / `text-slate-500`)
- **Primary Accent**: Corporate Blue (`#3b82f6` / `bg-blue-600` / `border-blue-500`)
- **Impact Indicators**:
  - High Impact: Quiet Muted Red (`bg-red-500/10 text-red-400 border border-red-500/20`)
  - Medium Impact: Muted Amber (`bg-amber-500/10 text-amber-400 border border-amber-500/20`)
  - Low Impact / Neutral: Slate (`bg-slate-800 text-slate-300 border border-slate-700`)

### 2.2 Typography & Layout Structure
- **Font Family**: Inter / System Sans-serif stack (`font-sans`)
- **Maximum Content Width**: 1280px (`max-w-7xl`) for dashboards, 768px (`max-w-3xl`) for editorial reading
- **Alignment**: Strictly left-aligned headings and body copy (no centered paragraph blocks)
- **Border Radius System**: Standardized 6px (`rounded-md`) to 8px (`rounded-lg`). Eliminate all 24px–40px pill rounded corners (`rounded-2xl`, `rounded-3xl`, `rounded-full`).

### 2.3 Spacing Scale
- Use a 4px-based spacing system: `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px), `p-8` (32px).
- Maintain generous but controlled section whitespace without huge empty Hero banners.

---

## 3. Component Modifications

### 3.1 Global CSS (`app/globals.css`)
- Remove all `@keyframes pulseGlow`, `floatBg`, `floatReverse` keyframe animations.
- Remove `.glass-card` backdrop blur overloads and neon shadow hover effects.
- Clean up global scrollbar styling to subtle slate neutral styling (`scrollbar-thumb-slate-800`).

### 3.2 Main Landing Portal (`app/page.tsx`)
- Replace large gradient Hero text with a clean, left-aligned executive header.
- Re-architect workspace entry cards into a structured, editorial 2-column grid with subtle 1px slate borders, informative titles, and specific action buttons ("Launch Workspace").

### 3.3 Italian Political Watch Dashboard (`app/politics-tracker/page.tsx`)
- Replace glowing fuchsia badges, oversized 30px cards, and floating neon buttons with clean slate cards (`bg-slate-900 border border-slate-800 rounded-lg`).
- Redesign the "In-Depth Analysis" modal: solid dark background (`bg-slate-900`), clean header, crisp typography, and standard 8px buttons.
- Update header to feature the quiet twice-daily sync badge (`Auto-Refresh: 2x/Day`) and subtle "Sync Live Data" control.

### 3.4 Workspaces (`app/parliament/page.tsx`, `app/comitology/page.tsx`, `app/have-your-say/page.tsx`, `app/eurlex/page.tsx`, `app/legal/page.tsx`, `app/enel/page.tsx`)
- Apply the unified design system tokens across all strategic sub-pages.
- Ensure consistent font scale, left-aligned headings, hairline borders, and zero decorative background shapes.

---

## 4. Verification & Quality Assurance
1. **No Decorative "AI Slop"**: Verify zero floating background blobs, neon glows, glassmorphism overloads, or emojis as interface icons.
2. **Visual Consistency**: Verify uniform 6px/8px border radii and color palette across all pages.
3. **Build & Type Check**: Execute `npm run build` to confirm zero compilation errors.
