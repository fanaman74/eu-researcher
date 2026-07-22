# Clean Restrained Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the entire visual UI design system across the EU-Researcher webapp to eliminate generic AI design anti-patterns (neon glows, purple/pink background gradients, floating animation blobs, 30px oversized pill cards, glassmorphism overloads) and establish a clean, restrained, high-density Editorial Corporate Intelligence Portal.

**Architecture:** Update `app/globals.css` base tokens and utilities, refine typography and layout structure across main landing page `app/page.tsx`, political tracker `app/politics-tracker/page.tsx`, and strategic workspaces (`app/parliament`, `app/comitology`, `app/have-your-say`, `app/eurlex`, `app/legal`, `app/enel`).

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, Lucide React icons.

---

### Task 1: Clean Global CSS (`app/globals.css`)

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Inspect `app/globals.css`**

Review keyframe animations and glassmorphism classes to replace with crisp dark tokens.

- [ ] **Step 2: Rewrite `app/globals.css`**

```css
@import "tailwindcss";

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    background-color: #0b0f19; /* Charcoal Canvas */
    color: #f3f4f6; /* Off-White Text */
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}

/* Subdued Card Container Utility */
.editorial-card {
  background-color: rgba(19, 26, 39, 0.7);
  border: 1px solid #263346;
  border-radius: 0.5rem; /* 8px radius */
  transition: border-color 0.15s ease-in-out, background-color 0.15s ease-in-out;
}

.editorial-card:hover {
  background-color: rgba(21, 29, 42, 0.9);
  border-color: #3b82f6; /* Corporate Blue accent */
}

/* Subtle Scrollbar Customization */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #0b0f19;
}

::-webkit-scrollbar-thumb {
  background: #263346;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3b82f6;
}

* {
  scrollbar-width: thin;
  scrollbar-color: #263346 #0b0f19;
}
```

- [ ] **Step 3: Commit `app/globals.css` updates**

```bash
git add app/globals.css
git commit -m "style: remove AI slop animations/glows and establish restrained dark CSS tokens"
```

---

### Task 2: Redesign Main Landing Portal (`app/page.tsx`)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace hero and workspace cards in `app/page.tsx`**

Remove floating colorful blobs, neon shadows, and centered marketing copy. Replace with a clean left-aligned executive header, clear category labels, and a 2-column structured grid with 8px border radii and action buttons ("Launch Workspace", "Access Feed").

- [ ] **Step 2: Verify `app/page.tsx` syntax**

Run: `npx tsc --noEmit`
Expected: Zero type errors in `app/page.tsx`.

- [ ] **Step 3: Commit `app/page.tsx`**

```bash
git add app/page.tsx
git commit -m "refactor: redesign landing page into restrained editorial corporate portal"
```

---

### Task 3: Redesign Italian Political Tracker (`app/politics-tracker/page.tsx`)

**Files:**
- Modify: `app/politics-tracker/page.tsx`

- [ ] **Step 1: Replace oversized pill containers & fuchsia glow effects**

Standardize all event cards, filter panels, and buttons to 6px/8px border radii (`rounded-md` / `rounded-lg`). Update impact badges to clean muted status tags (High: Muted Red, Medium: Muted Amber, Low: Slate). Clean up modal dialog to solid slate background without 50px blur shadow.

- [ ] **Step 2: Commit `app/politics-tracker/page.tsx`**

```bash
git add app/politics-tracker/page.tsx
git commit -m "refactor: update political tracker UI with restrained 8px slate containers and muted status tags"
```

---

### Task 4: Redesign EUR-Lex & Legal Aid Hunter Pages (`app/eurlex/page.tsx`, `app/legal/page.tsx`)

**Files:**
- Modify: `app/eurlex/page.tsx`
- Modify: `app/legal/page.tsx`

- [ ] **Step 1: Update `app/eurlex/page.tsx` and `app/legal/page.tsx`**

Apply the clean design system tokens: left-aligned editorial headers, 8px rounded search inputs, clean hairline table/list borders, and crisp action links.

- [ ] **Step 2: Commit changes**

```bash
git add app/eurlex/page.tsx app/legal/page.tsx
git commit -m "refactor: apply restrained editorial design system to EUR-Lex and Legal Aid pages"
```

---

### Task 5: Redesign Corporate Workspaces (`app/parliament/page.tsx`, `app/comitology/page.tsx`, `app/have-your-say/page.tsx`, `app/enel/page.tsx`)

**Files:**
- Modify: `app/parliament/page.tsx`
- Modify: `app/comitology/page.tsx`
- Modify: `app/have-your-say/page.tsx`
- Modify: `app/enel/page.tsx`

- [ ] **Step 1: Update corporate workspace pages**

Align all remaining workspace pages with the design system: 8px border radii, hairline dividers, left-aligned typography, and zero decorative background shapes.

- [ ] **Step 2: Commit changes**

```bash
git add app/parliament/page.tsx app/comitology/page.tsx app/have-your-say/page.tsx app/enel/page.tsx
git commit -m "refactor: standardize corporate public affairs workspaces with clean design tokens"
```

---

### Task 6: End-to-End Verification

- [ ] **Step 1: Execute production build**

Run: `npm run build`
Expected: Build succeeds with zero compilation or type errors.

- [ ] **Step 2: Commit and push**

```bash
git add .
git commit -m "chore: complete clean restrained design system overhaul"
git push
```
