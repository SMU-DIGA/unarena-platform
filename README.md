# UNArena Platform — UN Voting 1946–2025

An interactive website on United Nations Security Council and General Assembly
meetings and votes, 1946–2025.

**Website:** the pages sit at the repository root — open `index.html`. GitHub
Pages serves the repository root, so page URLs carry no subfolder. Addresses from
before the move (`…/_site/…`) are redirected by `404.html`.

## Contents

| Path | What it is |
|---|---|
| `*.html`, `assets/` | The website (static HTML/JS; charts use ECharts) |
| `data/*.json` | The aggregated datasets behind the charts (each also as `.js` so the pages open from disk) |
| `data/zh.json` | Chinese text for the bilingual site: milestones, entries, categories, country names (the EN / 中 switch in the header; `?lang=zh` links straight to it) |
| `_events/wiki/` | Dated Wikipedia passages used as background on the entry pages |

The underlying meeting-record corpus is **not** part of this repository and is
not published. The site carries only aggregated statistics and a meeting index
(date, agenda, counts).

## Known limits

- **General Assembly 1983–1992** is thinly covered (seven sessions under 50%);
  read those years as a collection gap, not a trend. Coverage per session is on
  the *Analysis* page.
- **Emergency special session resolutions (ES-…)** of the Assembly are not
  covered.

## Sources and licences

- Meeting records and resolutions: United Nations documents (Official Document
  System).
- Background passages in `_events/wiki/` are quoted from English Wikipedia
  under **CC BY-SA 4.0**; each file lists its source articles and revision ids.
- Entry images are from Wikimedia Commons; their individual licences and
  authors are recorded in `data/topic_images.json` and shown on the site.
