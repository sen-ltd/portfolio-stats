/**
 * stats.js — Pure stat computation functions.
 * All functions are side-effect-free and take an entries array.
 */

/**
 * Count entries by category.
 * @param {Array} entries
 * @returns {Map<string, number>}
 */
export function countByCategory(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = e.category || "unknown";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

/**
 * Count entries by tech (flattens tech arrays).
 * @param {Array} entries
 * @returns {Map<string, number>}
 */
export function countByTech(entries) {
  const map = new Map();
  for (const e of entries) {
    const techs = Array.isArray(e.tech) ? e.tech : [];
    for (const t of techs) {
      map.set(t, (map.get(t) || 0) + 1);
    }
  }
  return map;
}

/**
 * Count entries by tag (flattens tags arrays).
 * @param {Array} entries
 * @returns {Map<string, number>}
 */
export function countByTag(entries) {
  const map = new Map();
  for (const e of entries) {
    const tags = Array.isArray(e.tags) ? e.tags : [];
    for (const t of tags) {
      map.set(t, (map.get(t) || 0) + 1);
    }
  }
  return map;
}

/**
 * Count entries by stage.
 * @param {Array} entries
 * @returns {Map<string, number>}
 */
export function countByStage(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = e.stage || "unknown";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

/**
 * Sum testCount across all entries.
 * @param {Array} entries
 * @returns {number}
 */
export function totalTests(entries) {
  return entries.reduce((sum, e) => sum + (Number(e.testCount) || 0), 0);
}

/**
 * Group entries by YYYY-MM (based on createdAt).
 * @param {Array} entries
 * @returns {Map<string, number>} key = "YYYY-MM"
 */
export function entriesByMonth(entries) {
  const map = new Map();
  for (const e of entries) {
    if (!e.createdAt) continue;
    const month = String(e.createdAt).slice(0, 7); // "YYYY-MM"
    map.set(month, (map.get(month) || 0) + 1);
  }
  return map;
}

/**
 * Return entries sorted descending by testCount, limited to `limit`.
 * @param {Array} entries
 * @param {number} limit
 * @returns {Array}
 */
export function topEntriesByTests(entries, limit = 5) {
  return [...entries]
    .filter((e) => Number(e.testCount) > 0)
    .sort((a, b) => (Number(b.testCount) || 0) - (Number(a.testCount) || 0))
    .slice(0, limit);
}

/**
 * Alias: group entries by creation date (full date string).
 * @param {Array} entries
 * @returns {Map<string, number>}
 */
export function countByCreationDate(entries) {
  const map = new Map();
  for (const e of entries) {
    if (!e.createdAt) continue;
    const key = String(e.createdAt);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

/**
 * Average tests per entry (entries with testCount > 0 only).
 * @param {Array} entries
 * @returns {number}
 */
export function averageTestsPerEntry(entries) {
  const withTests = entries.filter((e) => Number(e.testCount) > 0);
  if (withTests.length === 0) return 0;
  const total = withTests.reduce((s, e) => s + Number(e.testCount), 0);
  return total / withTests.length;
}

/**
 * Sort a Map by value descending, return array of [key, value] pairs.
 * @param {Map} map
 * @param {number} limit
 * @returns {Array}
 */
export function sortedEntries(map, limit = Infinity) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}
