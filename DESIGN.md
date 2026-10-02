---
name: EU Researcher
description: The day's issue of a gazette for EU affairs monitoring, modelled on the Official Journal.
colors:
  primary: "#003399"
  primary-hover: "#00256e"
  on-primary: "#ffffff"
  link: "#003399"
  ring: "#003399"
  marker: "#ffcc00"
  canvas: "#ffffff"
  sunken: "#f1f2f4"
  line: "#d2d4d8"
  line-strong: "#16181d"
  fg: "#16181d"
  muted: "#42464e"
  subtle: "#5f646d"
  success: "#0b6b3a"
  warning: "#8a5a00"
  danger: "#a8201a"
  night-primary: "#3f6fe6"
  night-primary-hover: "#2f5bcb"
  night-link: "#a4bcff"
  night-ring: "#a4bcff"
  night-canvas: "#0f1217"
  night-sunken: "#191d25"
  night-line: "#2e343e"
  night-line-strong: "#ecebe7"
  night-fg: "#ecebe7"
  night-muted: "#bdbbb5"
  night-subtle: "#9a9892"
  night-success: "#79d6a2"
  night-warning: "#f0c060"
  night-danger: "#ff9d94"
typography:
  display:
    fontFamily: "Source Serif 4, Iowan Old Style, Times New Roman, serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  wordmark:
    fontFamily: "Source Serif 4, Iowan Old Style, Times New Roman, serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Source Serif 4, Iowan Old Style, Times New Roman, serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Source Serif 4, Iowan Old Style, Times New Roman, serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "lnum, tnum"
  title:
    fontFamily: "Source Serif 4, Iowan Old Style, Times New Roman, serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.55
  lead:
    fontFamily: "Source Serif 4, Iowan Old Style, Times New Roman, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "lnum, tnum"
  body-sm:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.08em"
rounded:
  none: "0"
spacing:
  entry: "12px"
  gutter-sm: "16px"
  gutter-md: "24px"
  section: "32px"
  gutter-lg: "40px"
  column-gap: "48px"
  control-sm: "36px"
  control: "44px"
  contents-column: "288px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "{spacing.control}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.fg}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "{spacing.control}"
  button-secondary-hover:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.canvas}"
  button-ghost:
    textColor: "{colors.link}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "{spacing.control}"
  segmented-option:
    textColor: "{colors.fg}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "{spacing.control}"
  segmented-option-hover:
    backgroundColor: "{colors.sunken}"
  segmented-option-selected:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.canvas}"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.fg}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "{spacing.control}"
  badge:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "1px 6px"
  section-code:
    textColor: "{colors.fg}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0 8px"
    height: "32px"
  contents-line:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.fg}"
    typography: "{typography.lead}"
    rounded: "{rounded.none}"
    padding: "12px 56px 12px 0"
  nav-link:
    textColor: "{colors.muted}"
    typography: "{typography.body-sm}"
    height: "32px"
  nav-link-current:
    textColor: "{colors.fg}"
---

# Design System: EU Researcher

## Overview

**Creative North Star: "The Official Journal"**

The site is the day's issue of a gazette, modelled on the Official Journal of the European Union: dated, numbered, ruled and plain. Every page sits inside the same printed frame: a Contents column at the left, a masthead with the wordmark, the date, a day-of-year issue line and a boxed section code, closed by a heavy rule over a hairline. Below it, a page is a serif title, a serif standfirst, and sections that open with the same double rule.

Structure comes from rules and type, never from boxes. There are no filled cards, no rounded corners and no shadows; every radius token is zero and the one shadow token is `none`. Entries in a list are separated by hairlines. Colour is ink on paper, EU blue for links and the primary action, and one flag-yellow square that marks the current line. Status is an outlined, square label whose meaning is in its words.

Two editions ship. The day edition (light, the default) is white paper and near-black ink. The night edition (dark) follows the system setting unless the reader picks one, and inverts to warm off-white ink on a blue-black sheet with a lighter blue. Both use the same rules, type and layout.

**Key Characteristics:**
- Rules instead of containers: a 3px rule over a 1px hairline opens a section; 1px hairlines separate entries.
- Square corners everywhere and no shadows.
- Serif for titles, standfirsts, entry titles and figures; sans for controls, tables, labels and small print.
- Lining tabular figures throughout; reference numbers are set in the text sans, not a code face.
- One yellow square marks the current or selected line.
- Dotted-leader contents lines: label, leader, figure.
- Two motions only: the masthead rule draws once, and a leader inks solid on hover or focus.

## Colors

Ink on paper with a single institutional blue and a single yellow mark; status colours appear only as text and outline.

### Primary
- **EU Blue** (`primary`, `link`, `ring`): links, the one solid primary button on a page, the focus outline, the text caret, and the fill of share bars. Hover on the primary button deepens to `primary-hover`. In the night edition the fill lightens to `night-primary` and links and focus use the paler `night-link`.

### Secondary
- **Flag Yellow** (`marker`): an 8px square before the current line in Contents and before the selected row in a master list, and the text-selection highlight (always with day-edition ink on top). Identical in both editions.

### Tertiary
- **Notice Green / Amber / Red** (`success`, `warning`, `danger`): text and 1px outline of status labels and notices, and the outline and icon of an error block. Never a fill. The night edition uses the lighter `night-*` values.

### Neutral
- **Paper** (`canvas`): the page, the Contents column, inputs, and the patch behind a contents-line figure. `night-canvas` in the night edition.
- **Ink** (`fg`, `line-strong`): text, the heavy rules, the Contents column edge, control outlines, and the fill of a selected segment or a hovered secondary button.
- **Second Ink** (`muted`): standfirsts, descriptions, unselected Contents lines.
- **Small-Print Grey** (`subtle`): dates, source notes, table headers, group labels, series codes, leader dots.
- **Hairline** (`line`): entry separators, neutral badge outline, loading placeholders.
- **Sunken** (`sunken`): hover on icon and outlined controls, unselected-segment hover, and the track of a share bar. Never a container background.

### Named Rules
**The One Mark Rule.** Yellow appears only as the 8px square on the current or selected line and as the selection highlight. It is never a background, a border, a badge or a button.

**The Words First Rule.** Status colour only tints text and its outline; the meaning is always written out in the label.

**The Two Editions Rule.** Every colour is used through its semantic token so the day and night editions stay the same design. No raw hex in components.

## Typography

**Display Font:** Source Serif 4 (with Iowan Old Style, Times New Roman, serif)
**Body Font:** Public Sans (with ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** none distinct; the mono slot resolves to Public Sans with tabular figures.

**Character:** A reading serif with a bold weight for titles and figures, beside a plain civic sans for everything that is operated or tabulated. All `h1` to `h3` are serif by default.

### Hierarchy
- **Display** (700, 2rem / 2.5rem from 640px / 3rem from 1024px, line-height 1.08, -0.02em): the page title, one per page.
- **Wordmark** (700, 1.5rem / 2.25rem from 640px, line-height 1, -0.02em): the masthead name, with a sans 0.875rem line under it.
- **Headline** (700, 1.25rem, -0.01em): section titles under a double rule, and the "Contents" heading.
- **Figure** (700, 1.5rem / 1.875rem from 640px, line-height 1, tabular): the count at the end of a contents line.
- **Title** (600, 1.0625rem serif): entry titles in lists; bold when the entry is selected. Contents-line labels use the serif at 1.125rem / 1.25rem, regular weight.
- **Lead** (400, 1.125rem serif, max 65ch): the standfirst under a page title.
- **Body** (400, 1rem, line-height 1.55): base text. Most interface text, descriptions and table cells are set at 0.875rem.
- **Label** (600, 0.75rem, uppercase, 0.08em for group headings, 0.06em for table headers): the heading of a navigation or index group and column headers. Badges use 0.75rem semibold in sentence case.

### Named Rules
**The Figures Rule.** Numbers are lining and tabular everywhere. Document references (CELEX, procedure numbers) are data and are set in Public Sans at 0.75rem, never in a monospace face.

**The Serif Reads, Sans Operates Rule.** Anything read as content (titles, standfirst, entry titles, counts) is serif; anything operated or scanned as a grid (buttons, inputs, tables, labels, small print) is sans.

## Layout

A fixed Contents column (288px, full height, ink rule on its right edge) sits at the left from 1024px. Below 1024px it becomes a drawer opened by an outlined "Contents" button in the masthead, 85% wide to a 20rem maximum over a 50% black scrim.

The masthead and every page share one measure: max width 80rem, gutters of 16px, 24px from 640px, and 40px from 1024px. The masthead is a three-part line (wordmark, centred date and issue, boxed section code) from 1280px; below that the date drops under the rule. A page stacks its blocks 32px apart; top padding is 24px (32px from 1024px) and bottom padding 48px (64px from 1024px).

Sections are laid in ruled columns, not tiles: two columns from 1024px with a 48px column gap and 40px row gap; index lists run one, two, then four columns (640px, 1280px) with a 40px gap. List entries have 12px vertical padding between hairlines. Controls are 44px high (36px for the small size); text links get 4px of block padding so the target is at least 24px.

## Elevation & Depth

Flat. The system has no shadows: the only shadow token is `none`, and no component sets one. Depth is not simulated; order is carried by rule weight (3px over 1px, then 1px ink, then 1px hairline). The only overlay treatment is the 50% black scrim behind the mobile Contents drawer, and the drawer itself is separated by a 1px ink rule.

### Named Rules
**The Printed Sheet Rule.** A printed sheet has no rounded corners and casts no shadow. Separate with a rule, never with lift.

## Shapes

Every corner is square: all radius steps resolve to 0. Form is made of straight lines in three weights: the double rule (3px ink with a 1px ink hairline directly beneath, 5px tall in total), the 1px ink rule (control outlines, table header, column edge), and the 1px hairline. The yellow marker is an 8px square. Bars are plain rectangles 6px or 8px tall. Icons are 1.5px-stroke line icons at 14px to 24px, always beside a text label or carrying an accessible name.

## Components

Plain and exact: controls are outlined rectangles that invert or underline, never lift.

### Buttons
- **Shape:** square (0 radius), 44px high with 16px side padding; small size 36px with 12px. Label 0.875rem semibold.
- **Primary:** solid EU blue with white text and a matching 1px border; one per page, in the title row or beside a search field.
- **Secondary (default):** paper with ink text and a 1px ink outline; on hover it inverts to ink with paper text.
- **Ghost:** blue text, no outline; an underline appears on hover.
- **Hover / Focus:** colour change over 150ms; focus is a 2px blue outline offset 2px. Disabled is 50% opacity. A busy button shows a spinning 16px icon.

### Status labels and notices
- **Style:** 1px outline in the tone colour, tone-coloured text, no fill, 0.75rem semibold, 1px by 6px padding. Neutral uses second ink with a hairline outline. Notices are the same treatment at 0.875rem with 12px by 16px padding.
- **AI label:** the amber label reading "AI-generated — check against the sources".

### Segmented choice
- **Style:** an ink-outlined row of 44px options divided by 1px ink rules. The selected option is solid ink with paper text; others show the sunken tint on hover.

### Sections
- **Corner Style:** square.
- **Background:** none; a section is the page.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** the double rule on top only.
- **Internal Padding:** 16px under the rule, then a 1.25rem bold serif title with optional right-aligned text link, 16px before the content.

### Inputs / Fields
- **Style:** 1px ink outline on paper, square, 44px high, 12px side padding; 1rem text on phones and 0.875rem from 640px; placeholder in small-print grey. A semibold 0.875rem label sits above and an optional hint below.
- **Focus:** the outline turns blue with a 2px blue ring at 30% opacity.
- **Search:** a 16px search icon inside the left edge, with an optional primary submit button to the right.

### Navigation
- **Contents column:** a bold serif "Contents" heading, then groups headed by an uppercase label over a hairline. Each line is 0.9375rem with an 8px square slot before it, the page name, and a right-aligned series code in small-print grey. Default is second ink; hover turns ink, underlines, and shows a hairline-grey square; the current line is semibold ink with the yellow square. The edition switch sits at the foot, above a hairline.
- **Masthead:** wordmark at left, date and day-of-year issue line centred, and a boxed section code (1px ink outline, 32px high, semibold) at right, closed by the double rule.
- **Breadcrumbs:** 0.875rem small-print grey with chevron separators above the page title.

### Tables and lists
- **Tables:** header cells are uppercase labels between two 1px ink rules; body cells have 12px padding and a hairline beneath.
- **Lists:** entries divided by hairlines with 12px vertical padding; a date or figure column in bold serif at left where the list is dated.
- **Facts:** label and value pairs in a two-column grid (160px label column), 0.875rem.

### Contents Line (signature)
A whole-row link: a serif label, an optional sans hint after an em dash (hidden below 640px), a dotted leader that starts where the label ends, and a bold serif tabular figure at the right edge on a paper patch. A hairline closes the row. On hover or focus a solid ink line draws over the dots from left to right in 360ms and the figure underlines.

### Share bar
A 6px or 8px sunken track with an EU blue fill proportional to the value, always beside the written figure.

### States
- **Loading:** a sentence saying what is loading, a second sentence after four seconds explaining slow sources, and empty hairline-topped rows as placeholders.
- **Empty:** a block between two hairlines, centred, with a line icon, a title and a sentence.
- **Error:** a 1px red-outlined block with a warning icon, a plain title and message, and a small "Try again" button.

### Motion
The masthead double rule draws from the left once per load (700ms, ease-out expo). The contents-line leader inks solid on hover or focus (360ms, same curve). Controls change colour in 150ms. Reduced motion removes all of it.

## Do's and Don'ts

### Do:
- **Do** open every section with the double rule (3px ink over a 1px hairline) and separate entries with 1px hairlines.
- **Do** keep every corner at 0 radius and every surface without a shadow.
- **Do** set titles, standfirsts, entry titles and counts in Source Serif 4, and controls, tables, labels and small print in Public Sans.
- **Do** use the semantic colour tokens so the day and night editions stay in step.
- **Do** mark the current or selected line with the 8px yellow square together with a heavier weight.
- **Do** write the meaning of a status in the label and use colour only for its text and outline.
- **Do** keep one solid blue primary button per page; every other action is outlined or a text link.
- **Do** keep controls 44px high and the focus outline at 2px blue with a 2px offset.
- **Do** honour reduced motion for the rule draw and the leader.

### Don't:
- **Don't** put content in filled, rounded or shadowed cards, or arrange counts as stat tiles.
- **Don't** use yellow for anything except the current-line square and the selection highlight.
- **Don't** fill a status label or notice with colour.
- **Don't** set reference numbers in a monospace face.
- **Don't** add motion beyond the masthead rule, the leader, and 150ms colour changes on controls.
- **Don't** use the sunken tint as a container background; it is for hover and bar tracks only.
- **Don't** reproduce the Enel logo or brand colours; no assets have been supplied and the wordmark stays text.
