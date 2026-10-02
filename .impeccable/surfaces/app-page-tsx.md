---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/AppShell.tsx","components/ui.tsx","app/globals.css"]
---

# Surface brief: whole site (app shell, Today, and every workspace page)

Scope: the replacement visual world for all routes. Visitor mode: Operate (Read on long-text panels).
Audience and job: public-affairs staff and public readers scanning what changed and preparing on one file or person.
Constraints confirmed by the owner: keep the navigation grouping and page names; do not look like a generic SaaS dashboard; Enel-branded as text only (no Enel assets supplied).
Build path: code-led (no image generation in this session).
Open: whether public visitors should see the Enel line in the masthead.

## Direction contract

THESIS: The site is the day's issue of a gazette, modelled on the Official Journal of the European Union: dated, numbered, ruled, and plain. It refuses the dashboard arrangement of sidebar brand block, stat tiles and rounded white cards.

OWN-WORLD: White paper, black ink, EU blue (#003399) for links and the one primary action, flag yellow (#FFCC00) only as the marker on the current contents line. Square corners, no shadows, no filled cards: sections open with a heavy rule over a hairline; entries are separated by hairlines. Source Serif 4 for titles and reading text, Public Sans for controls, tables and labels; lining tabular figures. Status is a square-cornered outlined label with its meaning in words. A boxed "EN"-style series code marks each page.

STORY: The reader sees today's date and issue number, reads the contents with counts, goes to what changed or what is due, and trusts it because each page states its source.

FIRST VIEWPORT: Left, a "Contents" column listing the four series (the existing navigation groups and page names) with the current line marked. Right, a masthead across the top: wordmark in bold serif at left, date and issue number centred, boxed series code at right, closed by a heavy-over-hairline rule. Under it the page title at display size, then Today's contents table: four lines with dotted leaders and right-aligned counts, each a link. Below, two ruled columns: deadlines and legislative files. The primary action on any page is one solid ink-blue square button in the title row.

SIGNATURE INTERACTION: Dotted-leader contents lines. On hover or focus the leader inks solid from left to right and the count underlines; the same leader pattern carries tables of counts across the site. MOTION GRAMMAR: one moment only, the masthead rule drawing from left to right on first load; everything else is instant state change, and reduced motion removes both.

FORM: The Official Journal, position 1 on the ordered list (Impeccable's pick, chosen by the owner over the assigned position 6). Seed key 0e08169b.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
