# RMMZ Dev Tools — VSCode Extension Plan

## Overview

RPG Maker MZ plugin developers have almost no dedicated tooling. Writing plugins in 2026 still feels like writing JavaScript in 2010: no IntelliSense, no validation, no debugger integration, no hot-reload.

This extension fills that gap with free core features and a paid Pro tier (Gumroad buy-once license).

## Target Users

- MZ plugin developers (JS / TypeScript)
- Game creators customizing existing plugins
- Game designers managing MZ project data

Community hubs: RPG Maker Forums, itch.io, Steam Community, Japanese Twitter/X

## Competitive Landscape

| Existing Tool | Status |
|---------------|--------|
| RPGMaker MV Plugin Generator (VSCode) | MV only, snippets only, last updated 2019 |
| RPGMaker JS Plugin Snippet (VSCode) | Snippets only, no completion/validation |
| LunaLite (VSCode) | MZ IntelliSense helper, effectively abandoned |
| Debugger for NWjs (VSCode) | Generic NW.js debugger, no MZ-specific features, no setVariable support |
| rpgmaker-plugin-conflict-finder (GitHub) | Static conflict detection, 6 stars, standalone CLI |
| VisuStella Debugger Plugin | In-game debug console (commercial), not a dev tool |

**No comprehensive MZ development extension exists.**

---

## Feature List

### Free Features (14)

| Feature | Description | Status |
|---------|-------------|--------|
| **Annotation Syntax Highlighting** | `/*:` / `/*:ja` / `/*~struct~` blocks highlighted with distinct colors for scope tags, type tags, dependency tags, metadata | Implemented |
| **Smart Tag Completion** | Context-aware `@tag` completion. In `@param` scope: shows `@text`, `@desc`, `@type`, `@min`, etc. At top level: shows `@param`, `@command`, `@base`, etc. | Implemented |
| **@type Completion** | All 24+ type values including `struct<>` and array variants. Shows description for each type. | Implemented |
| **Annotation Validation** | Unknown tag warnings, invalid `@type` values, scope violations (`@min` inside `@command`), missing `@plugindesc`/`@target`, type-specific tag misuse (`@min` with `@type string`) | Implemented |
| **Annotation Formatter** | Reorder tags in canonical order within annotation blocks | Implemented |
| **Hover Documentation** | Hover any `@tag` or `@type` value to see its description | Implemented |
| **Color Provider** | Inline color picker for hex colors in `@default` tags | Implemented |
| **IntelliSense One-Click Setup** | Detects MZ project → offers to generate `jsconfig.json` for core script completion. Non-intrusive (notification prompt, not auto-write). | Implemented |
| **Plugin Conflict Detection** | Static analysis of `js/plugins/` — detects multiple plugins overriding the same prototype method. Shows alias chains with CodeLens. Obfuscated plugins excluded. | Implemented |
| **Plugin Template Generator** | Command palette → scaffold new plugin with correct annotation block, parameter examples, and command registration boilerplate | Implemented |
| **Quick Actions Panel** | Webview button panel with categorized commands. Pro features show "PRO" badge when unlicensed. | Implemented |
| **Database Browser** | Tree view of all database files (Actors, Items, Weapons, etc.) | Implemented |
| **Note Tag Index** | Scans `data/*.json` to list all note tags across actors/skills/items/maps. Searchable index. | Implemented |
| **Asset Reference Checker** | Scans `@dir` and `@require` tags, cross-references against project directories, reports missing assets | Implemented |

### Pro Features — Gumroad buy-once license (14)

| Feature | Description | Gate | Status |
|---------|-------------|------|--------|
| **Debugger One-Click Setup** | Generates `launch.json` for VS Code's built-in Chrome debugger. F5 launch with breakpoints, step execution, variable editing. Auto-repairs `package.json` `chromium-args` when MZ editor overwrites it. | `requirePro` | Implemented |
| **Quick Scene Reload** | On plugin file save during testplay, automatically reloads the current scene with fresh plugin code. Not full hot-reload (state is not preserved, closures reset), but far faster than restarting from title. | `requirePro` | Implemented |
| **Live Game Preview** | Webview panel showing live screenshots of the running game, updated in real-time via CDP. | `requirePro` | Implemented |
| **Testplay Console** | Output channel capturing console.log/warn/error from the running game. Timestamped, with error tracking and reconnection handling. | `requirePro` | Implemented |
| **Game State Inspector** | Sidebar tree view of live game state — map, player position, party, gold, playtime, switches, variables. Auto-refresh toggle. | `isProLicensed` | Implemented |
| **Annotation Preview** | Webview panel showing how the plugin will appear in Plugin Manager. Live updates as you edit annotations. | `requirePro` | Implemented |
| **Plugin Dependency Graph** | Visualize `@base` / `@orderAfter` / `@orderBefore` as an interactive graph (Webview). Detect circular dependencies and ordering violations. | `requirePro` | Implemented |
| **Parameter Rename** | Rename `@param`/`@arg` tags with full refactoring — updates `@parent` references and `parameters["name"]` usage across code. | `isProLicensed` | Implemented |
| **Multi-Language Sync** | Structural consistency checker for locale blocks (`/*:`, `/*:ja`, etc.). Detects missing parameters and structural mismatches with CodeLens warnings. | `isProLicensed` | Implemented |
| **Data Hover Preview (Pro)** | Hover `$dataActors[3]` → see actor name/stats inline. Hover `$gameVariables.value(5)` → see variable name from System.json. | `isProLicensed` | Implemented |
| **Formula Evaluator** | Hover over damage/healing formula fields to see evaluated results inline. | `isProLicensed` | Implemented |
| **Visual Note Tag Editor** | Webview for visually editing note tags in actors, classes, items, and enemies. WYSIWYG editing. | `requirePro` | Implemented |
| **Class Hierarchy Browser** | Sidebar tree view of RMMZ class inheritance — Scenes, Windows, Sprites, Game objects. Searchable with links to source. | `requirePro` + `isProLicensed` | Implemented |
| **Plugin Registry Integration** | Check for plugin updates, view compatibility info, plugin metadata lookup. | `requirePro` | Implemented |

---

## Architecture

```
rmmz-dev-tools/
├── package.json
├── tsconfig.json
├── syntaxes/
│   └── rmmz-annotation.tmLanguage.json
├── snippets/
│   └── rmmz.code-snippets.json
├── images/
│   ├── icon.svg / icon.png
│   └── sidebar-icon.svg
├── src/
│   ├── extension.ts                   # Command registration, activation
│   ├── i18n.ts                        # Internationalization
│   ├── messages/
│   │   ├── en.ts                      # English strings
│   │   └── ja.ts                      # Japanese strings
│   ├── annotation/
│   │   ├── tags.ts                    # Complete MZ tag/type definitions
│   │   ├── completionProvider.ts      # @tag and @type completion
│   │   ├── hoverProvider.ts           # Hover documentation
│   │   ├── validator.ts              # Diagnostics
│   │   ├── formatter.ts              # Annotation block formatter
│   │   ├── colorProvider.ts          # Inline color picker
│   │   ├── renameProvider.ts         # [Pro] Parameter rename refactoring
│   │   └── langSync.ts              # [Pro] Multi-language sync checker
│   ├── intellisense/
│   │   └── setup.ts                   # jsconfig.json generation
│   ├── debugger/
│   │   └── setup.ts                   # [Pro] launch.json + package.json watcher
│   ├── template/
│   │   └── generator.ts              # Plugin scaffolding
│   ├── preview/
│   │   └── annotationPreview.ts      # [Pro] Plugin Manager preview webview
│   ├── conflict/
│   │   ├── detector.ts               # Prototype override analysis
│   │   └── codeLens.ts               # Conflict CodeLens warnings
│   ├── reload/
│   │   └── sceneReload.ts            # [Pro] Quick scene reload via CDP
│   ├── notetag/
│   │   ├── indexer.ts                # Note tag scanner
│   │   ├── provider.ts              # Note tag tree view
│   │   └── editor.ts                # [Pro] Visual note tag editor
│   ├── dependency/
│   │   └── graph.ts                  # [Pro] Dependency graph webview
│   ├── datalink/
│   │   ├── hover.ts                  # Data hover (basic: free, pro: extended)
│   │   └── formulaEvaluator.ts       # [Pro] Formula evaluation hover
│   ├── hierarchy/
│   │   └── browser.ts               # [Pro] Class hierarchy tree view
│   ├── registry/
│   │   └── manager.ts               # [Pro] Plugin registry integration
│   ├── asset/
│   │   └── checker.ts               # Asset reference checker
│   ├── database/
│   │   └── browser.ts               # Database browser tree view
│   ├── testplay/
│   │   ├── console.ts               # [Pro] Game console output
│   │   ├── livePreview.ts           # [Pro] Live game preview webview
│   │   └── stateInspector.ts        # [Pro] Game state inspector
│   ├── cdp/
│   │   └── client.ts                # Chrome DevTools Protocol client
│   ├── sidebar/
│   │   └── quickActions.ts          # Quick actions webview panel
│   ├── license/
│   │   └── gumroad.ts               # Gumroad license management
│   └── test/
│       └── *.test.ts                 # Unit tests (vitest)
└── docs/
    ├── plan.md
    ├── gumroad-listing.md
    └── demo-debugger-setvariable.md
```

---

## Status

All features implemented. v1.0.0 ready for release.

### Remaining Steps

1. **Publish to VS Marketplace**
2. **Publish Pro license on Gumroad** ($12 minimum, pay what you want)
3. Community outreach (Reddit, RPG Maker Forums)

---

## Pricing

| Tier | Price | Contents |
|------|-------|----------|
| Free | $0 | 14 features |
| Pro | $12+ (buy-once) | 14 additional features |

Gumroad "Pay what you want" with $12 minimum. 10% Gumroad fee → net $10.80+ per sale.

---

## Key Technical Decisions

- **No bundled type definitions** — MZ core scripts are not MIT-licensed. Instead, jsconfig.json points to the user's own `js/` folder for IntelliSense.
- **IntelliSense setup is opt-in** — notification prompt, never auto-writes files.
- **Chrome debug type instead of NW.js** — uses VS Code's built-in js-debug (`type: "chrome"`), which supports `setVariable` in the Variables panel. No external debugger extension required.
- **Quick Scene Reload, not Hot Reload** — honest naming. Plugin state/closures are not preserved. Scene is reconstructed with fresh code.
- **Obfuscated plugins explicitly excluded** from conflict detection — no point trying to analyze VisuStella minified code, and documenting this avoids support burden.
- **License auth cached locally** — `SecretStorage` API. Works offline after first verification. 7-day re-verification interval.
- **CDP integration** — Testplay features (console, live preview, state inspector, scene reload) communicate with the running game via Chrome DevTools Protocol on port 9222.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Trademark issues with "RPG Maker" in extension name | Use "RMMZ" abbreviation only |
| MZ core script license prevents type def bundling | Generate from user's project files |
| Quick Scene Reload breaks plugin state | Clear naming + documentation of limitations |
| VisuStella ecosystem lock-in reduces independent dev audience | Free tier still valuable for all plugin users |
| Small total addressable market | Low development cost; Pro price covers effort |

---

*Last updated: 2026-03-17*
