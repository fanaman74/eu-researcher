# Design Specification: Layout Reorganization & Section Visibility

This document outlines the design specification for improving the section visibility, layout organization, and tactile search category selectors of the Legal Data Hunter AI dashboard. 

---

## 1. Goal & Requirements
- **Interactive Category Bubbles**: Remove the Target Namespace select dropdown from the configuration settings. Instead, present the 10 EUR-Lex database sectors as beautiful, clickable, wrapping category bubbles/pills directly below the **Interactive Search Console** (Section 3) title header. Clicking a bubble instantly targets that namespace.
- **Search Depth Slider**: Relocate the Search Depth slider (`top_k`) to sit directly below the category bubbles in Section 3 as a sleek, full-width configuration control.
- **Enhanced Spotability**: Demarcate the main dashboard sections visually so they are extremely easy to distinguish at a glance.
- **Premium Aesthetics**: Inject glowing accent borders, absolute-positioned glassmorphic numbering badges, and color-coded ambient shadow meshes.

---

## 2. Component Reorganization

### Section 2: System Status & Presets
With target configuration parameters entirely integrated into Section 3, Section 2 is simplified into a beautiful horizontal row containing:
1. **Connection Status (1/3 Width)**: Confirms API status for OpenRouter (DeepSeek) and the EUR-Lex SPARQL endpoint.
2. **Quick Search Presets (2/3 Width)**: Clicking a preset auto-populates and fires the query.

### Section 3: Interactive Search Console & Config
This is now the main workspace container. It has a beautiful, vertical stacked layout:
1. **Console Title Header**: Styled with a pulsing purple scale icon and title text.
2. **Section Identifier Badge**: Absolute-positioned floating glass badge `[03 / Search & Config Console]`.
3. **Tactile Category Pills Row**: A horizontal flex row of 10 color-coded category bubbles wrapping beautifully on all viewports.
4. **Search Depth (top_k) Bar**: A sleek full-width range slider showing the exact document count limit dynamically.
5. **Chat Feed Log**: Renders messages, SPARQL log event accordions, and results tables.
6. **Query Input Bar**: Floating, round-pill natural language search bar with Send and Reset controls.

---

## 3. Sector Bubbles Mappings & Themes
Each category pill button is color-coded with custom glowing borders, matching text, and active pulsing indicators:

| Sector / Code | Display Label | Active State Styles | Theme Color |
|---|---|---|---|
| `case_law` | Case Law (Sector 6) | `border-emerald-500 bg-emerald-500/10 text-emerald-300` | Emerald |
| `statutes` | Secondary Legislation (Sector 3) | `border-cyan-500 bg-cyan-500/10 text-cyan-300` | Cyan |
| `regulatory` | Preparatory Documents (Sector 5) | `border-indigo-500 bg-indigo-500/10 text-indigo-300` | Indigo |
| `international` | Primary Law & Treaties (Sector 1) | `border-amber-500 bg-amber-500/10 text-amber-300` | Amber |
| `consolidated` | Consolidated Texts (Sector 0) | `border-rose-500 bg-rose-500/10 text-rose-300` | Rose |
| `agreements` | International Agreements (Sector 2) | `border-violet-500 bg-violet-500/10 text-violet-300` | Violet |
| `complementary` | Complementary Legislation (Sector 4) | `border-blue-500 bg-blue-500/10 text-blue-300` | Blue |
| `transposition` | National Transposition (Sector 7) | `border-yellow-500 bg-yellow-500/10 text-yellow-300` | Yellow |
| `national_case_law` | National Case-Law (Sector 8) | `border-teal-500 bg-teal-500/10 text-teal-300` | Teal |
| `parliamentary` | Parliamentary Questions (Sector 9) | `border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300` | Fuchsia |

---

## 4. Visual Section Demarcation
Each of the three main dashboard containers will be wrapped in a visually distinct, high-contrast container:

1. **Section 1: Luxembourg Live Feed**
   - **Border Accent**: `border-t-4 border-t-emerald-500`
   - **Glow Shadow**: `shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)]`
   - **Floating Badge**: `[01 / Luxembourg Live Feed]`

2. **Section 2: System Status & Presets**
   - **Border Accent**: `border-t-4 border-t-cyan-500`
   - **Glow Shadow**: `shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)]`
   - **Floating Badge**: `[02 / System & Presets]`

3. **Section 3: Search & Config Console**
   - **Border Accent**: `border-t-4 border-t-purple-500`
   - **Glow Shadow**: `shadow-[0_0_50px_-12px_rgba(168,85,247,0.15)]`
   - **Floating Badge**: `[03 / Search & Config Console]`

---

## 5. Verification Plan
- **Production Compilation**: Execute `npm run build` to ensure zero compilation or JSX structural parsing issues.
- **State Coupling**: Manually verify that clicking any category bubble immediately toggles the active state, styles the pill appropriately, and passes the targeted `namespace` value correctly to `/api/chat` searches.
