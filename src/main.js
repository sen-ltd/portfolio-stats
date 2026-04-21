/**
 * main.js — DOM orchestration, fetch, rendering.
 */

import {
  countByCategory,
  countByTech,
  countByTag,
  countByStage,
  totalTests,
  entriesByMonth,
  topEntriesByTests,
  averageTestsPerEntry,
  sortedEntries,
} from "./stats.js";
import { t } from "./i18n.js";

const DATA_URL = "https://sen.ltd/portfolio/data.json";

let lang = "ja";
let theme = "dark";
let allEntries = [];
let filterCategory = "all";
let filterTech = "all";
let filterStage = "all";
let searchQuery = "";

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function main() {
  applyTheme();
  applyLang();
  showLoading(true);
  try {
    const data = await fetchData();
    allEntries = data.entries || [];
    render(allEntries);
  } catch (err) {
    showError(err);
  } finally {
    showLoading(false);
  }
}

async function fetchData() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Theme / Lang ─────────────────────────────────────────────────────────────

function applyTheme() {
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById("theme-btn");
  if (btn) btn.textContent = theme === "dark" ? "☀ Light" : "🌙 Dark";
}

function applyLang() {
  document.documentElement.lang = lang === "ja" ? "ja" : "en";
  const btn = document.getElementById("lang-btn");
  if (btn) btn.textContent = t(lang, "langToggle");
}

document.getElementById("theme-btn")?.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  applyTheme();
});

document.getElementById("lang-btn")?.addEventListener("click", () => {
  lang = lang === "ja" ? "en" : "ja";
  applyLang();
  if (allEntries.length) render(allEntries);
});

// ─── Loading / Error ──────────────────────────────────────────────────────────

function showLoading(on) {
  const el = document.getElementById("loading");
  if (el) {
    el.hidden = !on;
    el.textContent = t(lang, "loading");
  }
}

function showError(err) {
  const el = document.getElementById("error");
  if (el) {
    el.hidden = false;
    el.textContent = `${t(lang, "error")} (${err.message})`;
  }
}

// ─── Main render ──────────────────────────────────────────────────────────────

function render(entries) {
  renderHero(entries);
  renderStatCards(entries);
  renderBarChart("chart-category", countByCategory(entries), t(lang, "categoriesTitle"));
  renderBarChart("chart-tech", countByTech(entries), t(lang, "techTitle"), 12);
  renderBarChart("chart-stage", countByStage(entries), t(lang, "stageTitle"));
  renderTimeline(entries);
  renderTopTested(entries);
  renderTagCloud(entries);
  renderExplorer(entries);
  renderSectionLabels();
}

function renderSectionLabels() {
  setTextById("section-category", t(lang, "categoriesTitle"));
  setTextById("section-tech", t(lang, "techTitle"));
  setTextById("section-stage", t(lang, "stageTitle"));
  setTextById("section-timeline", t(lang, "timelineTitle"));
  setTextById("section-top-tested", t(lang, "topTestedTitle"));
  setTextById("section-tags", t(lang, "tagsTitle"));
  setTextById("section-explorer", t(lang, "explorerTitle"));
}

function setTextById(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function renderHero(entries) {
  const tests = totalTests(entries);
  setTextById("hero-title", t(lang, "heroTitle"));
  setTextById("hero-subtitle", t(lang, "heroSubtitle"));
  setTextById("hero-tagline", t(lang, "heroTagline", { tests: tests.toLocaleString() }));
  setTextById("milestone-msg", t(lang, "milestoneMsg"));
}

// ─── Stat cards ───────────────────────────────────────────────────────────────

function renderStatCards(entries) {
  const tests = totalTests(entries);
  const avg = averageTestsPerEntry(entries);

  setTextById("stat-total", entries.length.toLocaleString());
  setTextById("stat-total-label", t(lang, "totalEntries"));
  setTextById("stat-tests", tests.toLocaleString());
  setTextById("stat-tests-label", t(lang, "totalTests"));
  setTextById("stat-avg", avg.toFixed(1));
  setTextById("stat-avg-label", t(lang, "avgTests"));

  const stageCounts = countByStage(entries);
  const done = (stageCounts.get("done") || 0) + (stageCounts.get("listed") || 0) +
    (stageCounts.get("articled") || 0) + (stageCounts.get("published") || 0);
  setTextById("stat-done", done.toLocaleString());
  setTextById("stat-done-label", lang === "ja" ? "公開済み" : "Published+");
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function renderBarChart(containerId, map, title, topN = 99) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const pairs = sortedEntries(map, topN);
  if (pairs.length === 0) return;

  const max = pairs[0][1];
  const list = document.createElement("ul");
  list.className = "bar-chart";

  for (const [key, val] of pairs) {
    const pct = max > 0 ? (val / max) * 100 : 0;
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="bar-label">${escHtml(labelFor(key))}</span>
      <span class="bar-track">
        <span class="bar-fill" style="width:${pct.toFixed(1)}%"></span>
      </span>
      <span class="bar-value">${val}</span>`;
    list.appendChild(li);
  }

  container.appendChild(list);
}

function labelFor(key) {
  const stageMap = {
    planned: "企画 / Planned",
    dev: "開発 / Dev",
    published: "公開 / Published",
    articled: "記事化 / Articled",
    listed: "掲載 / Listed",
    done: "完了 / Done",
  };
  return stageMap[key] || key;
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function renderTimeline(entries) {
  const container = document.getElementById("chart-timeline");
  if (!container) return;
  container.innerHTML = "";

  const map = entriesByMonth(entries);
  if (map.size === 0) return;

  // Sort months chronologically
  const pairs = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(...pairs.map((p) => p[1]));

  const list = document.createElement("ul");
  list.className = "bar-chart timeline-chart";

  for (const [month, count] of pairs) {
    const pct = max > 0 ? (count / max) * 100 : 0;
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="bar-label">${escHtml(month)}</span>
      <span class="bar-track">
        <span class="bar-fill timeline-fill" style="width:${pct.toFixed(1)}%"></span>
      </span>
      <span class="bar-value">${count}</span>`;
    list.appendChild(li);
  }
  container.appendChild(list);
}

// ─── Top tested ───────────────────────────────────────────────────────────────

function renderTopTested(entries) {
  const container = document.getElementById("top-tested-list");
  if (!container) return;
  container.innerHTML = "";

  const top = topEntriesByTests(entries, 5);
  const ol = document.createElement("ol");
  ol.className = "top-tested";

  for (const e of top) {
    const li = document.createElement("li");
    const name = lang === "ja" ? (e.name?.ja || e.slug) : (e.name?.en || e.slug);
    const demo = e.demo ? `<a href="${escHtml(e.demo)}" target="_blank" rel="noopener">${escHtml(name)}</a>` : escHtml(name);
    li.innerHTML = `<span class="top-name">${demo}</span><span class="top-count">${e.testCount} tests</span>`;
    ol.appendChild(li);
  }
  container.appendChild(ol);
}

// ─── Tag cloud ────────────────────────────────────────────────────────────────

function renderTagCloud(entries) {
  const container = document.getElementById("tag-cloud");
  if (!container) return;
  container.innerHTML = "";

  const pairs = sortedEntries(countByTag(entries), 30);
  const max = pairs.length > 0 ? pairs[0][1] : 1;

  for (const [tag, count] of pairs) {
    const size = 0.75 + (count / max) * 1.25;
    const span = document.createElement("span");
    span.className = "tag-chip";
    span.style.fontSize = `${size.toFixed(2)}rem`;
    span.textContent = `#${tag}`;
    span.title = `${count}`;
    container.appendChild(span);
  }
}

// ─── Explorer ─────────────────────────────────────────────────────────────────

function renderExplorer(entries) {
  renderFilterControls(entries);
  renderGrid(entries);
}

function renderFilterControls(entries) {
  renderFilterSelect("filter-category", countByCategory(entries), filterCategory, (v) => {
    filterCategory = v;
    renderGrid(allEntries);
  });
  renderFilterSelect("filter-tech", countByTech(entries), filterTech, (v) => {
    filterTech = v;
    renderGrid(allEntries);
  });
  renderFilterSelect("filter-stage", countByStage(entries), filterStage, (v) => {
    filterStage = v;
    renderGrid(allEntries);
  });

  const searchEl = document.getElementById("search-input");
  if (searchEl) {
    searchEl.placeholder = t(lang, "searchPlaceholder");
    searchEl.oninput = (ev) => {
      searchQuery = ev.target.value.toLowerCase();
      renderGrid(allEntries);
    };
  }
}

function renderFilterSelect(id, map, currentVal, onChange) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = `<option value="all">${t(lang, "filterAll")}</option>`;
  for (const [key] of sortedEntries(map)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = labelFor(key);
    opt.selected = key === (currentVal !== "all" ? currentVal : prev);
    sel.appendChild(opt);
  }
  sel.onchange = () => onChange(sel.value);
}

function renderGrid(entries) {
  const container = document.getElementById("entry-grid");
  if (!container) return;

  let filtered = entries;
  if (filterCategory !== "all") filtered = filtered.filter((e) => e.category === filterCategory);
  if (filterTech !== "all") filtered = filtered.filter((e) => (e.tech || []).includes(filterTech));
  if (filterStage !== "all") filtered = filtered.filter((e) => e.stage === filterStage);
  if (searchQuery) {
    filtered = filtered.filter((e) => {
      const slug = (e.slug || "").toLowerCase();
      const nameJa = (e.name?.ja || "").toLowerCase();
      const nameEn = (e.name?.en || "").toLowerCase();
      return slug.includes(searchQuery) || nameJa.includes(searchQuery) || nameEn.includes(searchQuery);
    });
  }

  container.innerHTML = "";

  if (filtered.length === 0) {
    const msg = document.createElement("p");
    msg.className = "no-results";
    msg.textContent = t(lang, "noResults");
    container.appendChild(msg);
    return;
  }

  for (const e of filtered) {
    const card = document.createElement("article");
    card.className = `entry-card stage-${e.stage || "unknown"}`;
    const name = lang === "ja" ? (e.name?.ja || e.slug) : (e.name?.en || e.slug);
    const pitch = lang === "ja" ? (e.pitch?.ja || "") : (e.pitch?.en || "");
    const numBadge = e.number ? `<span class="entry-num">#${e.number}</span>` : "";
    const stageBadge = e.stage
      ? `<span class="stage-badge stage-${e.stage}">${labelFor(e.stage)}</span>`
      : "";
    const demoLink = e.demo
      ? `<a class="card-link" href="${escHtml(e.demo)}" target="_blank" rel="noopener">Demo ↗</a>`
      : "";
    const iconLinks = renderIconLinks(e);
    const techPills = (e.tech || [])
      .map((t) => `<span class="tech-pill">${escHtml(t)}</span>`)
      .join("");
    const testBadge =
      e.testCount > 0 ? `<span class="test-badge">${e.testCount} tests</span>` : "";

    card.innerHTML = `
      <header class="card-header">
        ${numBadge}
        <h3 class="card-title">${escHtml(name)}</h3>
        ${stageBadge}
      </header>
      <p class="card-pitch">${escHtml(pitch)}</p>
      <footer class="card-footer">
        <div class="card-techs">${techPills}</div>
        <div class="card-meta">${testBadge}${demoLink}${iconLinks}</div>
      </footer>`;
    container.appendChild(card);
  }

  const count = document.getElementById("grid-count");
  if (count) count.textContent = `${filtered.length} / ${entries.length}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Brand icons (paths from simple-icons, CC0) ───────────────────────────────
// Each icon uses its canonical brand color so platforms stay visually
// distinguishable at 20px (Qiita green in particular is hard to recognize
// silhouette-only).

const ICON_SIZE = 20;

const ICON_DEFS = {
  github: {
    title: "GitHub",
    color: "#181717",
    d: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  },
  x: {
    title: "X",
    color: "#000000",
    d: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
  },
  qiita: {
    title: "Qiita",
    color: "#55C500",
    d: "M12 0C5.3726 0 0 5.3726 0 12s5.3726 12 12 12c3.3984 0 6.4665-1.413 8.6498-3.6832-.383-.0574-.7746-.2062-1.1466-.4542-.7145-.4763-1.3486-.9263-1.6817-1.674-1.2945 1.3807-3.0532 1.835-5.1822 2.0503-4.311.4359-8.0456-1.4893-8.4979-6.2996-.1922-2.045.2628-3.989 1.1804-5.582l-.5342-2.1009c-.0862-.3652.2498-.7126.6057-.6262l1.8456.448c1.0974-.9012 2.4249-1.49 3.8892-1.638 1.2526-.1267 2.467.0834 3.571.5624l1.7348-1.0494c.3265-.1974.7399.0257.7711.4164l.1 2.4747v.0002c1.334 1.4084 2.2424 3.3319 2.4478 5.516.116 1.2339-.012 2.1776-.339 3.078-.1531.4215-.1992.7778.0776 1.1305.2674.3408.6915 1.0026 1.1644.8917.7107-.1666 1.4718-.1223 1.9422.1715C23.4925 15.9525 24 14.0358 24 12c0-6.6274-5.3726-12-12-12Zm-.0727 5.727a5.2731 5.2731 0 0 0-.6146.0273c-2.2084.2233-3.9572 1.8135-4.4937 3.8484l-1.3176-.1996-.014.2589 1.2972.1407c-.0352.1497-.0643.2384-.086.3923l-1.1319.0902.0103.2025 1.1032-.088c-.0194.1713-.031.2814-.0332.4565l-1.0078.412.0495.2499.9598-.4492c.002.1339.008.2053.0207.3407.2667 2.8371 2.6364 3.3981 5.4677 3.1118 2.8312-.2863 5.0517-1.3114 4.785-4.1486-.013-.1361-.0324-.2068-.0553-.3392l1.0397.2257.0242-.229-1.0906-.207c-.0342-.1687-.0765-.271-.1264-.4327l1.1208-.1374-.0158-.2019-1.1499.1409a5.1093 5.1093 0 0 0-.1665-.4259l1.2665-.4042-.0397-.2536-1.3471.4667c-.819-1.7168-2.5002-2.8224-4.4546-2.8482Z",
  },
  devto: {
    title: "dev.to",
    color: "#0A0A0A",
    d: "M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.3zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z",
  },
};

function iconSvg(key) {
  const def = ICON_DEFS[key];
  return `<svg role="img" viewBox="0 0 24 24" width="${ICON_SIZE}" height="${ICON_SIZE}" fill="${def.color}" aria-label="${def.title}"><title>${def.title}</title><path d="${def.d}"/></svg>`;
}

function iconLink(href, iconKey, title) {
  return `<a href="${escHtml(href)}" class="icon-link" target="_blank" rel="noopener" title="${escHtml(title)}">${iconSvg(iconKey)}</a>`;
}

function renderIconLinks(e) {
  const articles = Array.isArray(e.articles) ? e.articles : [];
  const qiita = articles.find((a) => a && a.platform === "qiita");
  const devto = articles.find((a) => a && a.platform === "devto");
  const sen = articles.find((a) => a && a.platform === "sen");
  const twitter = e.social?.twitter;

  if (!e.github && !twitter && !qiita && !devto && !sen) return "";

  const parts = [];
  if (e.github) parts.push(iconLink(e.github, "github", "GitHub"));
  if (twitter) parts.push(iconLink(twitter, "x", "X (Twitter)"));
  if (qiita) parts.push(iconLink(qiita.url, "qiita", "Qiita"));
  if (devto) parts.push(iconLink(devto.url, "devto", "dev.to"));
  if (sen && !qiita) {
    const label = lang === "ja" ? "記事" : "JA";
    const title = lang === "ja" ? "JA 記事" : "Japanese article";
    parts.push(
      `<a href="${escHtml(sen.url)}" class="article-badge" target="_blank" rel="noopener" title="${escHtml(title)}">${label}</a>`,
    );
  }

  return `<div class="icon-links">${parts.join("")}</div>`;
}

// ─── Start ────────────────────────────────────────────────────────────────────

main();
