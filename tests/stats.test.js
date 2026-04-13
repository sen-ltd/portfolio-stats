/**
 * stats.test.js — Tests for pure stat functions.
 * Run: node --test tests/stats.test.js
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  countByCategory,
  countByTech,
  countByTag,
  countByStage,
  totalTests,
  entriesByMonth,
  topEntriesByTests,
  countByCreationDate,
  averageTestsPerEntry,
  sortedEntries,
} from "../src/stats.js";

// ─── Sample data ──────────────────────────────────────────────────────────────

const sampleEntries = [
  {
    slug: "tool-a",
    number: 1,
    category: "dev-tool",
    tech: ["vanilla-js", "html", "css"],
    tags: ["debug", "tool"],
    stage: "done",
    testCount: 36,
    createdAt: "2026-04-10",
  },
  {
    slug: "tool-b",
    number: 2,
    category: "dev-tool",
    tech: ["react", "typescript"],
    tags: ["react", "tool"],
    stage: "published",
    testCount: 20,
    createdAt: "2026-04-10",
  },
  {
    slug: "game-a",
    number: 3,
    category: "game",
    tech: ["vanilla-js", "css"],
    tags: ["game", "puzzle"],
    stage: "dev",
    testCount: 15,
    createdAt: "2026-03-05",
  },
  {
    slug: "ref-a",
    number: 4,
    category: "ref",
    tech: ["vanilla-js"],
    tags: ["reference"],
    stage: "articled",
    testCount: 0,
    createdAt: "2026-03-20",
  },
  {
    slug: "calc-a",
    number: 5,
    category: "calc",
    tech: ["vue", "typescript"],
    tags: ["calc", "finance"],
    stage: "listed",
    testCount: 42,
    createdAt: "2026-02-15",
  },
];

// ─── countByCategory ──────────────────────────────────────────────────────────

describe("countByCategory", () => {
  it("counts correctly for sample data", () => {
    const map = countByCategory(sampleEntries);
    assert.equal(map.get("dev-tool"), 2);
    assert.equal(map.get("game"), 1);
    assert.equal(map.get("ref"), 1);
    assert.equal(map.get("calc"), 1);
  });

  it("returns empty Map for empty array", () => {
    const map = countByCategory([]);
    assert.equal(map.size, 0);
  });

  it("uses 'unknown' for entries without category", () => {
    const map = countByCategory([{ slug: "x" }]);
    assert.equal(map.get("unknown"), 1);
  });

  it("handles single entry", () => {
    const map = countByCategory([sampleEntries[0]]);
    assert.equal(map.get("dev-tool"), 1);
    assert.equal(map.size, 1);
  });
});

// ─── countByTech ──────────────────────────────────────────────────────────────

describe("countByTech", () => {
  it("flattens tech arrays correctly", () => {
    const map = countByTech(sampleEntries);
    assert.equal(map.get("vanilla-js"), 3);
    assert.equal(map.get("css"), 2);
    assert.equal(map.get("typescript"), 2);
    assert.equal(map.get("react"), 1);
    assert.equal(map.get("vue"), 1);
  });

  it("returns empty Map for empty array", () => {
    const map = countByTech([]);
    assert.equal(map.size, 0);
  });

  it("handles entry with empty tech array", () => {
    const map = countByTech([{ slug: "x", tech: [] }]);
    assert.equal(map.size, 0);
  });

  it("handles entry with missing tech field", () => {
    const map = countByTech([{ slug: "x" }]);
    assert.equal(map.size, 0);
  });

  it("handles entry with null tech field", () => {
    const map = countByTech([{ slug: "x", tech: null }]);
    assert.equal(map.size, 0);
  });
});

// ─── countByTag ───────────────────────────────────────────────────────────────

describe("countByTag", () => {
  it("counts tags correctly", () => {
    const map = countByTag(sampleEntries);
    assert.equal(map.get("tool"), 2);
    assert.equal(map.get("debug"), 1);
    assert.equal(map.get("react"), 1);
  });

  it("returns empty Map for empty array", () => {
    assert.equal(countByTag([]).size, 0);
  });
});

// ─── countByStage ─────────────────────────────────────────────────────────────

describe("countByStage", () => {
  it("counts stages correctly", () => {
    const map = countByStage(sampleEntries);
    assert.equal(map.get("done"), 1);
    assert.equal(map.get("published"), 1);
    assert.equal(map.get("dev"), 1);
    assert.equal(map.get("articled"), 1);
    assert.equal(map.get("listed"), 1);
  });

  it("returns empty Map for empty array", () => {
    assert.equal(countByStage([]).size, 0);
  });
});

// ─── totalTests ───────────────────────────────────────────────────────────────

describe("totalTests", () => {
  it("sums testCount correctly", () => {
    assert.equal(totalTests(sampleEntries), 36 + 20 + 15 + 0 + 42);
  });

  it("returns 0 for empty array", () => {
    assert.equal(totalTests([]), 0);
  });

  it("treats missing testCount as 0", () => {
    assert.equal(totalTests([{ slug: "x" }]), 0);
  });

  it("treats string testCount as number", () => {
    assert.equal(totalTests([{ testCount: "10" }]), 10);
  });
});

// ─── entriesByMonth ───────────────────────────────────────────────────────────

describe("entriesByMonth", () => {
  it("groups by YYYY-MM correctly", () => {
    const map = entriesByMonth(sampleEntries);
    assert.equal(map.get("2026-04"), 2);
    assert.equal(map.get("2026-03"), 2);
    assert.equal(map.get("2026-02"), 1);
  });

  it("returns empty Map for empty array", () => {
    assert.equal(entriesByMonth([]).size, 0);
  });

  it("skips entries without createdAt", () => {
    const map = entriesByMonth([{ slug: "x" }]);
    assert.equal(map.size, 0);
  });
});

// ─── topEntriesByTests ────────────────────────────────────────────────────────

describe("topEntriesByTests", () => {
  it("returns top 3 by testCount", () => {
    const top = topEntriesByTests(sampleEntries, 3);
    assert.equal(top.length, 3);
    assert.equal(top[0].testCount, 42);
    assert.equal(top[1].testCount, 36);
    assert.equal(top[2].testCount, 20);
  });

  it("excludes entries with 0 or missing testCount", () => {
    const top = topEntriesByTests(sampleEntries, 10);
    assert.ok(top.every((e) => Number(e.testCount) > 0));
    assert.equal(top.length, 4); // ref-a has 0 tests
  });

  it("returns empty array for empty input", () => {
    assert.deepEqual(topEntriesByTests([], 5), []);
  });

  it("defaults limit to 5", () => {
    const big = Array.from({ length: 10 }, (_, i) => ({
      slug: `e${i}`,
      testCount: i + 1,
    }));
    assert.equal(topEntriesByTests(big).length, 5);
  });
});

// ─── countByCreationDate ──────────────────────────────────────────────────────

describe("countByCreationDate", () => {
  it("counts full date strings", () => {
    const map = countByCreationDate(sampleEntries);
    assert.equal(map.get("2026-04-10"), 2);
    assert.equal(map.get("2026-03-05"), 1);
  });

  it("skips entries without createdAt", () => {
    const map = countByCreationDate([{ slug: "x" }]);
    assert.equal(map.size, 0);
  });
});

// ─── averageTestsPerEntry ─────────────────────────────────────────────────────

describe("averageTestsPerEntry", () => {
  it("computes average only for entries with testCount > 0", () => {
    // 36 + 20 + 15 + 42 = 113, count = 4
    const avg = averageTestsPerEntry(sampleEntries);
    assert.equal(avg, 113 / 4);
  });

  it("returns 0 for empty array", () => {
    assert.equal(averageTestsPerEntry([]), 0);
  });

  it("returns 0 when all testCounts are 0", () => {
    assert.equal(averageTestsPerEntry([{ testCount: 0 }, { testCount: 0 }]), 0);
  });
});

// ─── sortedEntries ────────────────────────────────────────────────────────────

describe("sortedEntries", () => {
  it("sorts descending by value", () => {
    const map = new Map([["a", 5], ["b", 10], ["c", 3]]);
    const result = sortedEntries(map);
    assert.equal(result[0][0], "b");
    assert.equal(result[1][0], "a");
    assert.equal(result[2][0], "c");
  });

  it("respects limit parameter", () => {
    const map = new Map([["a", 5], ["b", 10], ["c", 3]]);
    assert.equal(sortedEntries(map, 2).length, 2);
  });

  it("handles empty map", () => {
    assert.deepEqual(sortedEntries(new Map()), []);
  });
});
