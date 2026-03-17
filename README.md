[日本語版はこちら / Japanese](README.ja.md)

# RMMZ Dev Tools — VS Code Extension for RPG Maker MZ Plugin Development

The first comprehensive VS Code extension built specifically for RPG Maker MZ plugin developers. 14 free features + 14 Pro features covering annotation intelligence, testplay debugging, conflict detection, and more.

> Stop writing MZ plugins like it's 2010. Get syntax highlighting, validation, IntelliSense, and a full debugging workflow — all purpose-built for MZ's plugin annotation system.

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/abyo-software.rmmz-dev-tools)](https://marketplace.visualstudio.com/items?itemName=abyo-software.rmmz-dev-tools)
[![Discord](https://img.shields.io/discord/1234567890?label=Discord)](https://discord.gg/CDFmWGkfDC)

## Why RMMZ Dev Tools?

RPG Maker MZ plugin development has had almost zero dedicated tooling. Existing extensions are either abandoned, MV-only, or provide just snippets. This extension gives you a complete development environment:

- **Write faster** — annotation completion, @type suggestions, plugin templates
- **Catch bugs early** — real-time validation, conflict detection, asset checking
- **Debug without pain** — one-click debugger setup, variable editing, live game preview
- **Understand your project** — dependency graph, class hierarchy, database browser

## Free Features (14)

### Annotation Intelligence

| Feature | Description |
|---------|-------------|
| **Syntax Highlighting** | Color-coded `/*:`, `/*:ja`, `/*~struct~` blocks — scope tags, type tags, dependency tags, and metadata each get distinct colors |
| **Smart Tag Completion** | Context-aware `@tag` completion. In `@param` scope: `@text`, `@desc`, `@type`, `@min`, etc. Top level: `@param`, `@command`, `@base`, etc. |
| **@type Completion** | All 24+ MZ type values (`string`, `actor`, `struct<>`, `switch[]`, etc.) with descriptions |
| **Validation** | Catches typos (`@commnd`), invalid types (`@type numbre`), scope violations (`@min` inside `@command`), missing `@plugindesc` |
| **Hover Documentation** | Hover any `@tag` or `@type` to see what it does |
| **Formatter** | Reorder tags in canonical order within annotation blocks |
| **Color Provider** | Inline color picker for hex colors in `@default` tags |

### Project Tools

| Feature | Description |
|---------|-------------|
| **Plugin Conflict Detection** | Static analysis detects multiple plugins overriding the same prototype method. CodeLens warnings inline. |
| **Asset Reference Checker** | Validates `@dir` and `@require` tags against project files. Finds missing assets. |
| **IntelliSense Setup** | One-click `jsconfig.json` generation for `$gameParty`, `Window_Base`, etc. autocompletion |
| **Plugin Template Generator** | Scaffold a new plugin with correct annotation block and boilerplate code |
| **Quick Actions Panel** | All commands organized in a sidebar panel |
| **Database Browser** | Browse Actors, Items, Weapons, and all other database files in a sidebar tree |
| **Note Tag Index** | Scans `data/*.json` and lists all note tags across your project |

## Pro Features (14) — $12 one-time

Activate with a Gumroad license key. No subscription. Works offline.

### Testplay & Debugging

| Feature | Description |
|---------|-------------|
| **Debugger Setup** | One-click `launch.json` using VS Code's built-in JS debugger. F5 to launch, breakpoints, step execution, **variable editing in Variables panel**. Auto-repairs debug port. |
| **Quick Scene Reload** | Save your plugin → current scene reloads with fresh code. No restart from title screen. |
| **Live Game Preview** | Real-time game screenshot in a VS Code webview panel |
| **Testplay Console** | Captures console.log/warn/error from the running game into VS Code |
| **Game State Inspector** | Live sidebar showing map, party, gold, switches, variables with auto-refresh |

### Code Analysis & Refactoring

| Feature | Description |
|---------|-------------|
| **Annotation Preview** | Live webview showing how your plugin appears in RPG Maker's Plugin Manager |
| **Dependency Graph** | Interactive visualization of `@base`/`@orderAfter`/`@orderBefore`. Detects circular dependencies. |
| **Parameter Rename** | Rename `@param`/`@arg` tags — updates `@parent` references and `parameters["name"]` in code |
| **Multi-Language Sync** | Checks `/*:` and `/*:ja` blocks match structurally. CodeLens warnings for mismatches. |

### Data & Project

| Feature | Description |
|---------|-------------|
| **Data Hover (Pro)** | Hover `$dataActors[3]` → actor name/stats. Hover `$gameVariables.value(5)` → variable name. |
| **Formula Evaluator** | Hover damage/healing formulas → see evaluated results inline |
| **Note Tag Editor** | Visual WYSIWYG editor for note tags in actors, classes, items, enemies |
| **Class Hierarchy** | Searchable tree of RMMZ class inheritance — Scenes, Windows, Sprites, Game objects |
| **Plugin Registry** | Check for plugin updates and view compatibility info |

## Getting Started

1. Install from the [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=abyo-software.rmmz-dev-tools)
2. Open an RPG Maker MZ project folder in VS Code
3. The extension activates automatically when it detects `js/plugins/` or `data/System.json`

### Quick Start Commands

| Command | Description |
|---------|-------------|
| `RMMZ: Setup IntelliSense` | Generate `jsconfig.json` for core script completion |
| `RMMZ: Setup Debugger` | Generate `launch.json` for F5 debugging |
| `RMMZ: New Plugin` | Scaffold a new plugin file |
| `RMMZ: Activate Pro License` | Enter your Gumroad license key |

## Requirements

- VS Code 1.75.0+
- RPG Maker MZ project (with `js/plugins/` and `data/` directories)

## Pro License

Purchase a one-time license on [Gumroad](https://abyo-software.gumroad.com/) for $12+.

- One-time purchase, no subscription
- Works offline after activation
- 14 additional features unlocked immediately

## Support

- [Discord](https://discord.gg/CDFmWGkfDC)
- [GitHub Issues](https://github.com/youichi-uda/rmmz-dev-tools/issues)

## License

This extension is proprietary software. Free features may be used without restriction. Pro features require a valid license key. See [LICENSE.md](LICENSE.md) for full terms.
