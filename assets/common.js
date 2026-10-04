/* Shared chrome: nav, theme, language, and an ECharts wrapper that reads its
   colours from the CSS custom properties so light/dark stay in one place. */

/* ========================================================= language ======
   boot.js has already set <html lang>. Long passages are written twice in
   the page (data-l="en" / data-l="zh", hidden by CSS); short strings carry
   their Chinese in a data-zh attribute; strings built in script go through
   L(en, zh). Data text — milestones, entries, country names — comes from
   data/zh.js and is swapped into the data objects before any page script
   reads them, so page code renders whichever language is loaded. */
const LANG = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
const ZH = LANG === 'zh' ? (window.ZH || {}) : {};
const L = (en, zh) => (LANG === 'zh' && zh != null ? zh : en);
/* Country names stay English in the data, because the map joins on them;
   translate only at the point of display. */
const cname = (n) => (ZH.countries && ZH.countries[n]) || n;
/* Topic-drift category names, likewise kept English as data keys. */
const catname = (c) => (ZH.categories && ZH.categories[c]) || c;

(function localizeData() {
  if (LANG !== 'zh') return;
  const tp = ZH.topics || {};
  const T = window.TOPICS;
  if (T) {
    T.topics.forEach((t) => {
      const z = tp[t.id] || {};
      t.label_en = t.label;
      t.countries_en = t.countries;
      if (z.label) t.label = z.label;
      if (z.blurb) t.blurb = z.blurb;
      if (z.note) t.note = z.note;
      t.countries = t.countries.map(cname);
    });
    (T.countries || []).forEach((c) => c.topics.forEach((x) => {
      if (tp[x.id] && tp[x.id].label) { x.label_en = x.label; x.label = tp[x.id].label; }
    }));
  }
  const S = window.STORY;
  if (S) {
    S.eras.forEach((e) => Object.assign(e, (ZH.eras || {})[e.id] || {}));
    S.events.forEach((e) => Object.assign(e, (ZH.events || {})[e.year] || {}));
  }
  const TL = window.TIMELINE;
  if (TL) TL.events = TL.events.map(([y, t]) => [y, (ZH.timeline_events || {})[y] || t]);
})();

/* Short static strings: data-zh replaces the content, data-zh-ph the
   placeholder, data-zh-title the tooltip. The scripts sit at the end of
   <body>, so the whole page is parsed by the time this runs. */
(function translateStatic() {
  if (LANG !== 'zh') return;
  document.querySelectorAll('[data-zh]').forEach((el) => {
    if (el.tagName === 'TITLE') document.title = el.dataset.zh;
    else el.innerHTML = el.dataset.zh;
  });
  document.querySelectorAll('[data-zh-ph]').forEach((el) => { el.placeholder = el.dataset.zhPh; });
  document.querySelectorAll('[data-zh-title]').forEach((el) => { el.title = el.dataset.zhTitle; });
})();

/* The labels are the short form; each page's own <h1> carries the full name.
   The timeline story is the landing page now, so it has no tab of its own. */
const PAGES = [
  ['index.html', 'Timeline', '时间线'],
  ['geo.html', 'Map', '地图'],
  ['entries.html', 'Entries', '专题'],
  ['browse.html', 'Records', '会议记录'],
  ['timeline.html', 'Charts', '年度图表'],
  ['topics.html', 'Topics', '议题'],
  ['assessment.html', 'Analysis', '分析'],
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
  return L(`<div class="callout critical">
    <strong>This section needs a web server.</strong>
    It loads its background material over HTTP, and a page opened with <code>file://</code>
    is not allowed to do that. Serve the repository root (for example
    <code>python3 -m http.server</code>) and open it from there.
    Every other page works either way.
  </div>`, `<div class="callout critical">
    <strong>本部分需要通过网页服务器打开。</strong>
    它通过 HTTP 加载背景材料，而以 <code>file://</code> 直接打开的页面无法这样做。请在仓库根目录启动服务（例如 <code>python3 -m http.server</code>），再从那里打开。其他页面两种方式都能正常使用。</div>`);
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
    textStyle: { fontFamily: 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif' },
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

/* A plain globe for the wordmark. Deliberately not the UN emblem, whose use
   the Organization restricts: the site wears the colours, not the seal. */
const GLOBE = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
  <circle cx="16" cy="16" r="12.5"/><ellipse cx="16" cy="16" rx="5.6" ry="12.5"/>
  <path d="M3.5 16h25M5.6 9.5h20.8M5.6 22.5h20.8"/></svg>`;
/* The half-filled circle: one button that flips between light and dark. */
const CONTRAST = `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5v11a5.5 5.5 0 0 1 0-11z"/></svg>`;

const DARK_MQ = window.matchMedia('(prefers-color-scheme: dark)');
const isDark = () => {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : DARK_MQ.matches;
};

/* Until the visitor chooses, the page follows the system; the button then
   flips whichever theme is showing and remembers it. */
function toggleTheme() {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('una-theme', next); } catch (e) { /* private mode */ }
  requestAnimationFrame(() => REGISTRY.forEach((d) => d()));
}
/* Charts are painted with resolved colours, so a system switch while the page
   is open has to repaint them; a chosen theme is unaffected by it. */
DARK_MQ.addEventListener('change', () => {
  if (!document.documentElement.getAttribute('data-theme')) REGISTRY.forEach((d) => d());
});

/* The language switch is a plain link to this same page in the other
   language. The page reloads, which is what rebuilds every chart, list and
   tooltip; boot.js stores the choice on arrival, so it holds across pages. */
function otherLangHref() {
  const u = new URL(location.href);
  u.searchParams.set('lang', LANG === 'zh' ? 'en' : 'zh');
  return u.pathname.split('/').pop() + u.search + u.hash;
}

function initChrome() {
  let here = location.pathname.split('/').pop() || 'index.html';
  here = NAV_ALIAS[here] || here;
  const tabs = PAGES.map(([href, en, zh]) =>
    `<a class="tab" href="${href}"${href === here ? ' aria-current="page"' : ''}>${L(en, zh)}</a>`
  ).join('');

  /* Inserted first so it sits under everything, including the landing page's
     own per-era wash, which is a second fixed layer on top of this one. */
  document.body.insertAdjacentHTML('afterbegin',
    '<div class="sitebg" aria-hidden="true"><div class="mesh"></div>'
    + '<div class="dots"></div><div class="weave"></div></div>');

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="site"><nav class="nav" aria-label="${L('Site', '网站导航')}">
      <a class="brand" href="index.html">${GLOBE}
        ${L('UN Voting Corpus', '联合国表决记录')} <span class="full">1946–2025</span></a>
      <div class="tabs">${tabs}</div><div class="spacer"></div>
      <a class="langlink" href="${esc(otherLangHref())}"
        ${LANG === 'zh' ? 'hreflang="en" lang="en">EN' : 'hreflang="zh-CN" lang="zh-CN">中文'}</a>
      <button class="themebtn" id="theme-btn" type="button"
        aria-label="${L('Toggle light or dark theme', '切换浅色或深色主题')}"
        title="${L('Toggle light or dark theme', '切换浅色或深色主题')}">${CONTRAST}</button>
    </nav></header>`);

  document.getElementById('theme-btn').onclick = toggleTheme;
  /* boot.js has already applied a stored or ?theme= choice; the charts drawn
     before this point only need repainting in it. */
  requestAnimationFrame(() => REGISTRY.forEach((d) => d()));

  document.body.insertAdjacentHTML('beforeend', L(`
    <footer class="site">
      Source: the <code>RES_Security</code> and <code>RES_General</code> corpora, aggregated through the
      <code>_report</code> reconciliation layer. Both bodies are aligned on the <strong>calendar
      year</strong>. Two caveats affect every page: General Assembly coverage has gaps, worst in
      <strong>1980–1992</strong>; and Council vetoes are read from the voting rounds, which hold
      about four in five of the vetoed drafts on the published list (the missing ones are mostly
      meetings the corpus does not contain). Charts that depend on either say so where they appear.
    </footer>`, `
    <footer class="site">
      数据来源：<code>RES_Security</code> 与 <code>RES_General</code> 两个语料库，经
      <code>_report</code> 核对层汇总。两个机构统一按<strong>日历年</strong>对齐。有两点说明适用于所有页面：联合国大会的覆盖率存在缺口，以 <strong>1980–1992 年</strong>最为严重；安理会的否决数据取自表决记录，约涵盖官方公布清单中五分之四的被否决草案（缺失的大多是语料库未收录的会议）。凡受这两点影响的图表，都会在图表处注明。</footer>`));
}

/* Renders the table view that the palette's contrast relief rule requires. */
function tableView(container, headers, rows, caption) {
  const th = headers.map((h) => `<th>${h}</th>`).join('');
  const tr = rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? '—'}</td>`).join('')}</tr>`).join('');
  container.innerHTML = `
    <details class="tableview">
      <summary>${caption || L('Show data table', '显示数据表')}</summary>
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
  /* Wrap at about 24 Latin characters a line. Chinese has no spaces to break
     on and each character is roughly two Latin widths, so CJK runs are split
     per character and weighted double. */
  const CJK = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/;
  const tokens = [];
  String(title).split(' ').forEach((w, i) => {
    if (CJK.test(w)) [...w].forEach((ch, k) => tokens.push({ t: ch, sp: i > 0 && k === 0 }));
    else tokens.push({ t: w, sp: i > 0 });
  });
  const width = (str) => [...str].reduce((n, ch) => n + (CJK.test(ch) ? 1.9 : 1), 0);
  const lines = [];
  let cur = '';
  tokens.forEach(({ t, sp }) => {
    const next = cur + (cur && sp ? ' ' : '') + t;
    if (cur && width(next) > 24) { lines.push(cur); cur = t; }
    else cur = next;
  });
  if (cur) lines.push(cur);
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
      font-family="system-ui, sans-serif" letter-spacing="2.4">${esc(L(kicker.toUpperCase(), kicker === 'entry' ? '专题条目' : kicker))}</text>` : ''}
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
  return `<div class="credit">${L('Photo', '图片')}: ${esc(rec.artist)} · ${lic} · ${L('via', '来自')} ${page}</div>`;
}

document.addEventListener('DOMContentLoaded', initChrome);
