/* Shared chrome: nav, theme, and an ECharts wrapper that reads its colours
   from the CSS custom properties so light/dark stay in one place. */

/* The labels are the short form; each page's own <h1> carries the full name.
   The timeline story is the landing page now, so it has no tab of its own. */
const PAGES = [
  ['index.html', 'Timeline'],
  ['geo.html', 'Map'],
  ['entries.html', 'Entries'],
  ['browse.html', 'Records'],
  ['timeline.html', 'Charts'],
  ['topics.html', 'Topics'],
  ['assessment.html', 'Analysis'],
];

/* Detail views are reached from a listing rather than the bar, so they are not
   tabs — but they should still light the tab they belong under. */
const NAV_ALIAS = {
  'entry.html': 'entries.html',
  'story.html': 'index.html',
};

/* Entry pages fetch their background material over HTTP. Opened from disk,
   fetch() of a sibling file is blocked as cross-origin, so pages that need it
   say so plainly rather than failing with an empty list. */
const SERVED = location.protocol === 'http:' || location.protocol === 'https:';

function needsServerNotice() {
  return `<div class="callout critical">
    <strong>This section needs a web server.</strong>
    It loads its background material over HTTP, and a page opened with <code>file://</code>
    is not allowed to do that. Serve the repository root (for example
    <code>python3 -m http.server</code>) and open <code>/_site/</code> from there.
    Every other page works either way.
  </div>`;
}

function ink() {
  const s = getComputedStyle(document.documentElement);
  const v = (n) => s.getPropertyValue(n).trim();
  return {
    surface: v('--surface-1'),
    plane: v('--plane'),
    primary: v('--text-primary'),
    secondary: v('--text-secondary'),
    muted: v('--text-muted'),
    grid: v('--grid'),
    axis: v('--axis'),
    series: [v('--series-1'), v('--series-2'), v('--series-3'), v('--series-4'), v('--series-5')],
    seq: [v('--seq-100'), v('--seq-250'), v('--seq-400'), v('--seq-550'), v('--seq-700')],
    good: v('--good'),
    warning: v('--warning'),
    serious: v('--serious'),
    critical: v('--critical'),
  };
}

/* Axis/grid defaults applied to every chart, so no page repeats them. */
function baseOption() {
  const c = ink();
  return {
    textStyle: { fontFamily: 'system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif' },
    animationDuration: 380,
    tooltip: {
      backgroundColor: c.surface,
      borderColor: c.axis,
      borderWidth: 1,
      padding: [9, 12],
      textStyle: { color: c.primary, fontSize: 12.5 },
      extraCssText: 'box-shadow:0 6px 22px rgba(0,0,0,.14);border-radius:9px;',
    },
    legend: { textStyle: { color: c.secondary, fontSize: 12.5 }, itemGap: 16, icon: 'roundRect', itemWidth: 11, itemHeight: 11 },
  };
}

function axisStyle() {
  const c = ink();
  return {
    axisLine: { lineStyle: { color: c.axis } },
    axisTick: { show: false },
    axisLabel: { color: c.muted, fontSize: 11.5 },
    splitLine: { lineStyle: { color: c.grid, width: 1 } },
    nameTextStyle: { color: c.secondary, fontSize: 12 },
  };
}

/* Charts register themselves so a theme flip can rebuild them all. */
const REGISTRY = [];
function mountChart(el, build) {
  const chart = echarts.init(el, null, { renderer: 'canvas' });
  const draw = () => chart.setOption(build(ink(), baseOption(), axisStyle()), true);
  draw();
  REGISTRY.push(draw);
  new ResizeObserver(() => chart.resize()).observe(el);
  return chart;
}

function applyTheme(mode, persist = true) {
  if (mode === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', mode);
  if (persist) {
    try { localStorage.setItem('una-theme', mode); } catch (e) { /* private mode */ }
  }
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = { auto: 'Theme: system', light: 'Theme: light', dark: 'Theme: dark' }[mode];
  requestAnimationFrame(() => REGISTRY.forEach((d) => d()));
}

function initChrome() {
  let saved = 'auto';
  try { saved = localStorage.getItem('una-theme') || 'auto'; } catch (e) { /* ignore */ }
  /* ?theme=light|dark pins the mode for a shared link, a print, or a screenshot
     run, without touching the viewer's stored preference */
  const forced = new URLSearchParams(location.search).get('theme');
  if (forced === 'light' || forced === 'dark') saved = forced;
  if (saved !== 'auto') document.documentElement.setAttribute('data-theme', saved);

  let here = location.pathname.split('/').pop() || 'index.html';
  here = NAV_ALIAS[here] || here;
  const tabs = PAGES.map(([href, label]) =>
    `<a class="tab" href="${href}"${href === here ? ' aria-current="page"' : ''}>${label}</a>`
  ).join('');

  /* Inserted first so it sits under everything, including the landing page's
     own per-era wash, which is a second fixed layer on top of this one. */
  document.body.insertAdjacentHTML('afterbegin',
    '<div class="sitebg" aria-hidden="true"><div class="mesh"></div>'
    + '<div class="dots"></div><div class="weave"></div></div>');

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="site"><nav class="nav">
      <div class="brand">UN Voting Corpus <span>1946–2025</span></div>
      ${tabs}<div class="spacer"></div>
      <button class="ghost" id="theme-btn">Theme: system</button>
    </nav></header>`);

  const order = ['auto', 'light', 'dark'];
  const btn = document.getElementById('theme-btn');
  btn.onclick = () => {
    let cur = 'auto';
    try { cur = localStorage.getItem('una-theme') || 'auto'; } catch (e) { /* ignore */ }
    applyTheme(order[(order.indexOf(cur) + 1) % 3]);
  };
  applyTheme(saved, !forced);

  document.body.insertAdjacentHTML('beforeend', `
    <footer class="site">
      Source: the <code>RES_Security</code> and <code>RES_General</code> corpora, aggregated through the
      <code>_report</code> reconciliation layer. Both bodies are aligned on the <strong>calendar
      year</strong>. Two caveats affect every page: General Assembly coverage has gaps, worst in
      <strong>1980–1992</strong>; and Council vetoes are read from the voting rounds, which hold
      about four in five of the vetoed drafts on the published list (the missing ones are mostly
      meetings the corpus does not contain). Charts that depend on either say so where they appear.
    </footer>`);
}

/* Renders the table view that the palette's contrast relief rule requires. */
function tableView(container, headers, rows, caption) {
  const th = headers.map((h) => `<th>${h}</th>`).join('');
  const tr = rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? '—'}</td>`).join('')}</tr>`).join('');
  container.innerHTML = `
    <details class="tableview">
      <summary>${caption || 'Show data table'}</summary>
      <div class="tablewrap"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>
    </details>`;
}

const fmt = (n) => (n == null ? '—' : n.toLocaleString('en-US'));
const pct = (n) => (n == null ? '—' : n.toFixed(1) + '%');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ======================================================== pictures ======
   Cards on the landing page, the entry list and the entry pages all want a
   picture. Where a freely-licensed photograph was found for the subject, use
   it; where none exists, draw the entry's own record instead of shipping a
   stock image that illustrates nothing. Both paths return the same shape so
   the callers do not branch. */

/* Deterministic per-entry accent, stable across pages and reloads: a hash of
   the id, not a position in a list that re-sorts. */
function entryHue(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

/* The drawn cover is the entry's meetings per year. It is a real reading of
   the corpus — where the bars cluster is where that question was actually in
   front of the two bodies. */
function drawnCover(title, years, id, kicker) {
  const hue = entryHue(id || title);
  const W = 640, H = 360, pad = 34;
  const span = years && years.length
    ? [Math.min(...years.map((y) => y[0])), Math.max(...years.map((y) => y[0]))]
    : [1946, 2025];
  const lo = Math.min(span[0], 2020), hi = Math.max(span[1], lo + 4);
  const max = years && years.length ? Math.max(...years.map((y) => y[1])) : 1;
  const bw = Math.max(2.4, (W - pad * 2) / (hi - lo + 1) - 1.2);
  /* The bars have to stay clear of the title, which can run to three lines
     ending at y≈156 — so cap the tallest bar rather than let it climb behind
     the text. */
  const bars = (years || []).map(([y, n]) => {
    const x = pad + ((y - lo) / (hi - lo + 1)) * (W - pad * 2);
    const h = Math.max(2.5, (n / max) * (H - 232));
    return `<rect x="${x.toFixed(1)}" y="${(H - 52 - h).toFixed(1)}" width="${bw.toFixed(1)}"
             height="${h.toFixed(1)}" rx="1.4" fill="hsl(${hue} 62% 54%)" opacity=".9"/>`;
  }).join('');
  const words = String(title).split(' ');
  const lines = [];
  let cur = '';
  words.forEach((w) => {
    if ((cur + ' ' + w).trim().length > 24) { lines.push(cur.trim()); cur = w; }
    else cur += ' ' + w;
  });
  if (cur.trim()) lines.push(cur.trim());
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g${hue}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 34% 17%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 42) % 360} 40% 9%)"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g${hue})"/>
    ${bars}
    <line x1="${pad}" y1="${H - 52}" x2="${W - pad}" y2="${H - 52}"
      stroke="hsl(${hue} 30% 62%)" stroke-width="1" opacity=".55"/>
    ${kicker ? `<text x="${pad}" y="46" fill="hsl(${hue} 45% 74%)" font-size="15"
      font-family="system-ui, sans-serif" letter-spacing="2.4">${esc(kicker.toUpperCase())}</text>` : ''}
    ${lines.slice(0, 3).map((l, i) => `<text x="${pad}" y="${88 + i * 34}" fill="#fff"
      font-size="29" font-weight="640" font-family="system-ui, sans-serif">${esc(l)}</text>`).join('')}
    <text x="${pad}" y="${H - 26}" fill="hsl(${hue} 22% 70%)" font-size="14.5"
      font-family="system-ui, sans-serif" font-variant-numeric="tabular-nums">${span[0]} — ${span[1]}</text>
  </svg>`;
}

/* HTML for the picture of one card. `key` indexes topic_images.json:
   "topic:<id>" for an entry, "event:<year>" for a timeline node. */
function pictureFor(key, { title, years, id, kicker }) {
  const rec = (window.TOPIC_IMAGES || {})[key];
  if (rec) {
    return `<img src="assets/img/${esc(rec.local)}" alt="${esc(title)}"
      loading="lazy" width="${rec.width || ''}" height="${rec.height || ''}">`;
  }
  return drawnCover(title, years, id || key, kicker);
}

/* CC BY-SA and CC BY both require naming the author and the licence, so a
   picture is only shown together with its credit. Drawn covers credit the
   corpus instead — they are not third-party work. */
function creditFor(key, fallback) {
  const rec = (window.TOPIC_IMAGES || {})[key];
  if (!rec) return fallback ? `<div class="credit">${esc(fallback)}</div>` : '';
  const lic = rec.licence_url
    ? `<a href="${esc(rec.licence_url)}" target="_blank" rel="noopener">${esc(rec.licence)}</a>`
    : esc(rec.licence);
  const page = rec.page
    ? `<a href="${esc(rec.page)}" target="_blank" rel="noopener">Wikimedia Commons</a>`
    : 'Wikimedia Commons';
  return `<div class="credit">Photo: ${esc(rec.artist)} · ${lic} · via ${page}</div>`;
}

document.addEventListener('DOMContentLoaded', initChrome);
