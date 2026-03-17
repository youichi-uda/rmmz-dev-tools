# Reddit Post — r/RPGMaker

**Flair:** RMMZ

**Title:**
I'm building a VSCode extension for MZ plugin development — what features would you actually use?

**Images:**
- Image 1: スクリーンショット 2026-03-17 160709.png (validation + highlighting)
- Image 2: スクリーンショット 2026-03-17 160727.png (@type completion)

**Body:**

I write MZ plugins and got tired of zero tooling support, so I'm building a VSCode extension. Before I go too far, I want to hear what the community actually needs.

Screenshots show what's already working — annotation highlighting, validation, and `@type` autocomplete.

## What's working (free)

**Annotation intelligence:**
- Syntax highlighting for `/*: */` blocks — `@param`, `@type`, `@command`, `@arg` get proper coloring
- Smart completion — type `@` and get context-aware tag suggestions. Type `@type ` and get all valid types (`struct<>`, `actor`, `switch[]`, etc.)
- Validation — catches typos (`@type numbre`), wrong scope (`@default` inside `@command`), missing `@plugindesc`, unknown tags
- Hover documentation for every annotation tag

**Debugger setup:**
- One-click `launch.json` generation for NW.js debugger
- Auto-repairs `package.json` when MZ editor overwrites your `chromium-args` (you know the pain)

**IntelliSense:**
- Detects MZ project → generates `jsconfig.json` so `$gameParty`, `Window_Base`, etc. autocomplete without TypeScript setup

**Plugin scaffold:**
- Command palette → "RMMZ: New Plugin" → generates a properly annotated plugin file with params and commands

## What I'm planning for Pro ($9-12 one-time)

**Quick Scene Reload** — Save a plugin file during testplay → current scene auto-reloads with fresh code. Not full hot-reload (state resets to scene start), but way faster than restart-from-title.

**Plugin conflict detection** — Static analysis of `js/plugins/` to find multiple plugins overriding the same prototype method. Shows alias chains. (Obfuscated plugins excluded — can't analyze what you can't read.)

**Annotation preview** — Side panel showing how your plugin looks in Plugin Manager, updated live as you edit.

**Note tag index** — Scans all `data/*.json` to list note tags across actors/skills/items/maps. Finds undefined and unused tags.

**Data hover** — Hover `$dataActors[3]` → actor name. Hover `$gameVariables.value(5)` → variable name from System.json.

**Dependency graph** — Visualize `@base`/`@orderAfter`/`@orderBefore` as an interactive graph. Detects circular dependencies.

---

**Questions:**

1. Which features would you actually use? Anything missing that would be a must-have?
2. Would you pay ~$10 one-time for the Pro features, or does the free tier cover your needs?
3. Do you develop plugins in plain JS or TypeScript?
4. What's your biggest pain point in MZ plugin development right now?

Free version goes on the VS Marketplace either way. Just figuring out if Pro is worth building.

---

## Notes (internal, don't post)

- Post on Tuesday–Thursday for best engagement
- Submit as image post with 2 screenshots, body text in the first comment or as image captions
- Reply to every comment in first 3 hours
- If reception is good, crosspost to r/gamedev later
- r/RPGMaker rules: no spam, self-promo allowed if contributing to discussion
- Consider posting to RPG Maker Forums "Plugin Releases" or "General Discussion" as well
- Japanese community: consider Twitter/X post in Japanese with same screenshots
