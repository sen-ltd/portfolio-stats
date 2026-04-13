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
    const ghLink = e.github
      ? `<a class="card-link" href="${escHtml(e.github)}" target="_blank" rel="noopener">GitHub ↗</a>`
      : "";
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
        <div class="card-meta">${testBadge}${demoLink}${ghLink}</div>
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

// ─── Start ────────────────────────────────────────────────────────────────────

main();
