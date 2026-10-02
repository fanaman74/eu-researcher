# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A mixed audience, with no single dominant user (confirmed by the owner):

- EU public-affairs professionals at an energy utility, working from Brussels and reporting to a head office in Rome. They monitor legislative files, prepare meetings with MEPs and Commission staff, compare peer positions and send daily or weekly updates.
- Citizens and researchers who look up EU law, court judgments and consultations.

Both a fast daily scan (what changed, what is due) and occasional deep preparation on one file or one person are core uses; neither is secondary.

## Product Purpose

Bring the public EU sources an affairs office checks by hand into one place, organised by file and by date instead of by data source, and show what changed since yesterday. Success is a reader who can do the morning scan in minutes and can also prepare a meeting or a briefing from the same site without opening ten portals.

## Positioning

Every figure, date and name comes from a live official source and is labelled with that source and with what the source leaves out. Sections without a public data source are removed instead of mocked. AI-written text is always marked as such.

## Operating Context

- Desk work on a laptop or monitor during the working day; the digest and calendar are also read on a phone.
- Outputs leave the site: digests pasted into email or chat, Word and PowerPoint briefings, an Outlook calendar file.
- Sources: European Commission (Have Your Say, press corner, meeting transparency exports), European Parliament Open Data, HowTheyVote.eu, EUR-Lex/Cellar, Energy-Charts, Italian Chamber of Deputies open data, NewsData.io.
- Several sources are slow (up to 30 seconds on a cold cache) or rate-limited; the interface has to say so.

## Capabilities and Constraints

- Pages: Today (home), What changed, Calendar (with plenary agendas), Commission pipeline, Legislative files and file detail, MEP briefing, Peer positions, Commission meetings, European Parliament, Consultations, Search EU law, Latest EU law, State aid rulings, News and market, Italian politics, Briefing drafter (AI), Research assistant (AI).
- Next.js 15 App Router, React 19, Tailwind CSS v4, lucide-react icons, deployed on Railway.
- Hand-made mappings (watched files, peer list) live in code, not in the interface.
- Not covered because the sources refuse automated access or have no data service: the Council, ARERA, the Italian energy ministry, Parliament committee meetings, infringement decisions.
- No sign-in; nothing on the site is personalised.

## Brand Commitments

- The owner wants the site to read as an Enel-branded internal tool.
- No Enel brand assets (logo, typeface, colour values) have been supplied. Until they are, the Enel logo is not reproduced; the wordmark is text and must be easy to replace.
- Current product name in the interface: "EU Researcher".
- Voice: plain, factual, no hype; states limits openly.

## Evidence on Hand

- Live data from all the sources above; no testimonials, customers, pricing or benchmarks exist and none may be invented.
- Open decision: the audience answer ("mixed public audience") and the brand answer ("Enel-branded internal tool") pull in different directions. Whether public visitors should see Enel branding is not yet decided.

## Product Principles

1. The source is always visible: where a number comes from, when it was loaded, what it omits.
2. Organise by the reader's work (file, date, person, change), not by data feed.
3. Never fill a gap with invented or sample content.
4. A scan must be fast and a deep read must be comfortable; the same page often serves both.
5. Anything written by a model is labelled and never presented as analysis.

## Accessibility & Inclusion

WCAG 2.2 AA is the working standard already applied (contrast, keyboard access, visible focus, 24px minimum targets, reduced motion). Light and dark themes both ship.
