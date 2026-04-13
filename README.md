# portfolio-stats

> Milestone meta-dashboard celebrating 100 projects shipped by SEN LLC. Category charts, tech breakdown, timeline, and an entry explorer — all in vanilla JS with zero dependencies.

**Live demo:** https://sen.ltd/portfolio/portfolio-stats/

---

## What it does

- Fetches `https://sen.ltd/portfolio/data.json` at runtime
- Shows headline stats: total entries, total tests, average tests per project
- Bar charts for category, tech stack, and pipeline stage breakdowns
- Monthly release timeline
- Top 5 most-tested projects
- Tag cloud
- Browsable, filterable, searchable grid of all 100+ entries
- Japanese / English toggle, dark / light theme

## Tech

- Vanilla JS (ES modules), HTML, CSS — no framework, no build step, no dependencies
- Tests: Node.js built-in `node:test`

## Run locally

```sh
npm run serve      # python3 -m http.server 8080
# then open http://localhost:8080
```

## Tests

```sh
npm test
```

Requires Node.js 18+.

## Project structure

```
portfolio-stats/
├── index.html
├── style.css
├── src/
│   ├── main.js      # DOM, fetch, rendering
│   ├── stats.js     # Pure stat functions
│   └── i18n.js      # ja/en translations
├── tests/
│   └── stats.test.js
├── package.json
└── LICENSE
```

## License

MIT — © 2026 SEN LLC (SEN 合同会社)
