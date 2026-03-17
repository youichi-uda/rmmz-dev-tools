# Reddit Feedback #1 — Feature Requests & Insights

Source: r/RPGMaker post "I'm building a VSCode extension for MZ plugin development"
Date: 2026-03-17

## From comment by IntelliJ user (plugin developer, TypeScript, still learning MZ)

### Requested features

1. **Code navigation into core scripts (Go to Definition)**
   - Click a core function → jump to its implementation in rmmz_core.js etc.
   - Not just MZ core but also bundled libraries, especially PixiJS (js/libs/pixi.js)
   - Status: jsconfig.json setup should already provide this. Needs verification that it works for both core scripts and libs.

2. **Class hierarchy browser**
   - Sidebar showing MZ class inheritance tree (e.g. Scene_Base → Scene_MenuBase → Scene_Menu)
   - Goal: help developers find what methods to override
   - This is NOT in the current feature list. New feature candidate.
   - Suggested tier: Pro

3. **Live variable/switch state viewer**
   - Show current game variable and switch values during testplay
   - Already loosely planned as part of "Data hover" / "Switch/Variable name resolution" but this is more of a live inspector panel
   - Suggested tier: Pro

### Insights

- **IntelliJ usage exists** — if we implement as LSP (Language Server Protocol) instead of pure VSCode API, it works in IntelliJ too. Not Phase 1 priority but worth considering for architecture.
- **TypeScript users exist** — TS plugin scaffolding (tsconfig + bundler setup) has real demand. Currently in Phase 3 roadmap.
- **Biggest pain point: navigating core class hierarchy** — not just IntelliSense but understanding what's available to override. Documentation/discoverability problem.
- **Presentation matters** — English docs mandatory. Native-language-only pages get skipped. Need proper README, marketplace page, and showcase.

### Action items

- [x] Verify jsconfig.json setup enables Go to Definition for js/*.js AND js/libs/*.js — `include: ["js/**/*.js"]` covers both
- [x] Add "Class Hierarchy Browser" — Implemented as `src/hierarchy/browser.ts` (sidebar tree view with category grouping, method listing, Go to Definition on click, search via QuickPick)
- [ ] Consider LSP architecture for future IntelliJ compatibility — deferred, noted for Phase 3+
- [x] Ensure README and marketplace page are English-first — README.md created in English
