---
name: EU Researcher
description: A Bauhaus poster for today's energy policy, with a workspace for EU affairs.
colors:
  red: "#d02020"
  blue: "#1040c0"
  yellow: "#f0c020"
  ink: "#121212"
  canvas: "#f0f0f0"
  surface: "#ffffff"
  sunken: "#e0e0e0"
typography:
  display:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 8vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.89
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: "1.75rem"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.55
  control:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: "1.25rem"
    letterSpacing: "0.025em"
  label:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: "1rem"
    letterSpacing: "0.025em"
rounded:
  square: "0px"
  circle: "50%"
spacing:
  control-compact: "2.25rem"
  control: "2.75rem"
  gutter: "1rem"
  gutter-tablet: "1.5rem"
  gutter-desktop: "2.5rem"
  page-max: "80rem"
components:
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "{colors.surface}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    padding: "0 1rem"
    height: "{spacing.control}"
  button-secondary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.surface}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    padding: "0 1rem"
    height: "{spacing.control}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    padding: "0 1rem"
    height: "{spacing.control}"
  button-ghost:
    textColor: "{colors.blue}"
    typography: "{typography.control}"
    padding: "0 1rem"
    height: "{spacing.control}"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0 0.75rem 0 2.25rem"
    height: "{spacing.control}"
  status-label:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "0.125rem 0.375rem"
  nav-trigger:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    height: "{spacing.control}"
  nav-trigger-current:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
  workspace-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "1rem 1rem 1.25rem"
  document-disclosure:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
  document-disclosure-open:
    backgroundColor: "{colors.red}"
    textColor: "{colors.surface}"
  linked-count:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    padding: "0.875rem 1rem"
---

# Design System: EU Researcher

## Overview

**Creative North Star: "A Bauhaus poster for today's energy policy"**

The visual system uses the directness of a 1920s Bauhaus poster. Oversized Outfit headlines, overlapping geometric forms, solid blocks of primary colour and weighty ink rules give Today its character. The same outlines, type and control states carry through to calmer white work surfaces for tables, research and long documents.

**Key characteristics**

- Light-only canvas with red, blue and yellow accents.
- Square work surfaces and hard, unblurred offsets.
- Display typography and colour guide attention to the next task.
- Source links and written availability stay visible alongside the data.

## Colors

### Primary

- **Bauhaus Red** anchors the main action and marks an open disclosure. Use white type on red.
- **Bauhaus Blue** carries links, keyboard focus and secondary actions. It also fills the poster art and the Office news band.

### Secondary

- **Bauhaus Yellow** fills the linked count strip and directory, identifies the current navigation item or selection, and supports written warning labels. Pair it with ink.

### Neutral

- **Ink** defines text, rules, offset shadows and the footer. **Canvas** is the off-white page ground. **Surface** is the white used for cards, reading areas, fields and type on dark blocks. **Sunken** marks dividers, hover surfaces and loading placeholders.

## Typography

Use Outfit throughout, including tabular lining figures and document references. The Latin and Latin Extended variable WOFF2 files are self-hosted in `public/fonts` under the SIL Open Font License. The licence ships as `public/fonts/outfit-OFL.txt`. Use the system sans stack as the fallback.

Today’s display is heavy and uppercase (900, 0.89 line height). The mobile size scales from 2.5rem. At 48rem it uses `clamp(2.625rem, 6vw, 6rem)`. Shared page titles grow from 2.25rem to 3rem at 40rem and 3.75rem at 64rem. Controls and short labels use bold uppercase text. Keep body and long document text in sentence case with a comfortable line length.

## Layout

Today and workspace pages share an 80rem container and horizontal gutters of 1rem, 1.5rem from 40rem and 2.5rem from 64rem. Workspaces group related content with strong headings and white surfaces, keeping fine dividers inside tables and dense lists. Cap workspace introductions at 65ch and let paired controls wrap.

## Elevation & Depth

Major surfaces use a 2px ink rule with a 4px hard offset, increasing to a 4px rule and 8px offset from 64rem. Buttons, menus and Today’s data cards keep a 4px offset. Data cards lift 3px on hover or focus within. Reduced motion collapses transitions and removes that lift.

## Shapes

Keep working surfaces and controls square. Reserve circles, diamonds and triangles for the product mark, the poster, figures and small card accents. The product mark is three abstract primary-colour shapes next to the EU Researcher wordmark. The Enel EU Affairs attribution is text.

## Components

### Actions and fields

Use the red primary button for the main task, blue for a secondary filled action and white outline or text for supporting actions. Square filled and outline buttons have 2px ink borders and move 2px down and right on press as the hard shadow drops away. The default control height is at least 44px, with a 36px compact option. Inputs are white with a 2px ink border. Keep the 2px focus outline with a 3px offset. Focus is blue by default, white on the red and blue home-band headers and yellow in the ink footer.

### Cards and status

Workspace cards use white surfaces, an ink edge and a ruled heading. Today’s data cards add small corner shapes. Keep status text explicit on badges and notices, including source gaps and unavailable states.

### Navigation

Keep the established navigation groups in the sticky white header. On desktop, the current group or page is yellow and an expanded group is red. Below 48rem the Menu button opens a full-screen drawer with the same groups. Preserve keyboard dismissal, focus restoration and the current-page state.

### Document disclosure

A white summary opens to a red header with white type and a pale yellow reading panel separated by a 2px ink rule. The chevron turns 180 degrees. Leave source links and attachment availability with the relevant text.

## Do's and Don'ts

- Do use shared controls, square edges and hard offsets for data workspaces.
- Do describe loading, missing data and source coverage in words.
- Do retain visible keyboard focus and honour reduced-motion preferences.
- Don't add gradients or blur to the offset shadows.
- Don't reproduce the Enel logo without supplied brand assets.
