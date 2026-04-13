/**
 * i18n.js — Japanese / English translations.
 */

export const translations = {
  ja: {
    pageTitle: "ポートフォリオ統計",
    heroTitle: "100件、出荷しました。",
    heroSubtitle:
      "ゼロ依存、テスト完備、バニラ JS — SEN 合同会社ポートフォリオ プログラムの集大成",
    heroTagline: "100 プロジェクト。{tests} テスト。すべて依存なし。",
    totalEntries: "総エントリ数",
    totalTests: "総テスト数",
    avgTests: "平均テスト数",
    categoriesTitle: "カテゴリ別",
    techTitle: "技術スタック別",
    stageTitle: "ステージ別",
    timelineTitle: "月別リリース",
    topTestedTitle: "テスト数 トップ 5",
    tagsTitle: "人気タグ",
    explorerTitle: "エクスプローラー",
    filterAll: "すべて",
    filterBy: "絞り込み:",
    searchPlaceholder: "スラッグ・タイトルで検索",
    loading: "読み込み中…",
    error: "データの取得に失敗しました。",
    milestoneMsg:
      "ゼロから 100 件を出荷したのは、ひとつひとつのプロジェクトが積み重なった結果です。すべてのコードに意味があります。",
    testsUnit: "件",
    projectsUnit: "件",
    langToggle: "English",
    themeToggle: "ダーク",
    noResults: "該当なし",
    stageLabels: {
      planned: "企画",
      dev: "開発",
      published: "公開",
      articled: "記事化",
      listed: "掲載",
      done: "完了",
    },
  },
  en: {
    pageTitle: "Portfolio Stats",
    heroTitle: "100 projects shipped.",
    heroSubtitle:
      "Zero dependencies, well-tested, vanilla JS — the milestone dashboard for the SEN LLC portfolio program",
    heroTagline: "100 projects. {tests} tests. All zero dependencies.",
    totalEntries: "Total Entries",
    totalTests: "Total Tests",
    avgTests: "Avg Tests / Project",
    categoriesTitle: "By Category",
    techTitle: "By Tech Stack",
    stageTitle: "By Stage",
    timelineTitle: "Monthly Releases",
    topTestedTitle: "Top 5 by Tests",
    tagsTitle: "Popular Tags",
    explorerTitle: "Explorer",
    filterAll: "All",
    filterBy: "Filter:",
    searchPlaceholder: "Search by slug or title",
    loading: "Loading…",
    error: "Failed to load data.",
    milestoneMsg:
      "100 projects from zero — each one a deliberate slice of craft. Every commit matters.",
    testsUnit: "",
    projectsUnit: "",
    langToggle: "日本語",
    themeToggle: "Dark",
    noResults: "No results",
    stageLabels: {
      planned: "Planned",
      dev: "Dev",
      published: "Published",
      articled: "Articled",
      listed: "Listed",
      done: "Done",
    },
  },
};

export function t(lang, key, vars = {}) {
  const dict = translations[lang] || translations.ja;
  let str = dict[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, v);
  }
  return str;
}
