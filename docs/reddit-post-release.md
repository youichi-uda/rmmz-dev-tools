# Reddit Post — r/RPGMaker (Release Announcement)

**Flair:** RMMZ

**Title:**
Thanks for the feedback — RMMZ Dev Tools is now on the VS Marketplace (free + Pro)

**Images:**
- Image 1: annotation highlighting + validation
- Image 2: live game preview / scene reload
- Image 3: conflict detection CodeLens
- Image 4: debugger with variable editing

**Body:**

A few weeks ago I posted here asking what features MZ plugin developers actually need in a VSCode extension. Got some really helpful feedback — thanks to everyone who replied.

It's now live on the VS Marketplace: RMMZ Dev Tools v1.0.0

## Free (14 features)

- Annotation syntax highlighting for `/*: */` blocks
- Smart `@tag` and `@type` completion (context-aware)
- Real-time validation — catches typos, scope violations, missing tags
- Hover documentation for every annotation tag and type
- Annotation formatter (reorder tags in canonical order)
- Inline color picker for hex colors in `@default`
- Plugin conflict detection with CodeLens warnings
- Asset reference checker
- IntelliSense one-click setup (generates jsconfig.json)
- Plugin template generator
- Quick actions panel (all commands in one sidebar)
- Database browser sidebar
- Note tag index sidebar
- Data hover preview (basic)

## Pro ($12 one-time, 14 features)

Based on the feedback from the last post, I focused on the features people asked about most:

**Testplay integration** — this was the most requested area:
- Debugger setup (F5 launch, breakpoints, variable editing — no extra extension needed)
- Quick Scene Reload (save plugin → scene reloads with fresh code, no restart)
- Live game preview (real-time screenshot in VS Code)
- Testplay console (game console.log captured in VS Code)
- Game state inspector (party, switches, variables, map info — live sidebar)

**Code analysis:**
- Annotation preview (see how your plugin looks in Plugin Manager, live)
- Plugin dependency graph (@base/@orderAfter visualized, circular dependency detection)
- Parameter rename refactoring (@param → updates code references too)
- Multi-language sync (checks /*: and /*:ja blocks match structurally)

**Data tools:**
- Data hover (hover $dataActors[3] → see name/stats inline)
- Formula evaluator (hover damage formulas → see evaluated result)
- Visual note tag editor
- Class hierarchy browser (RMMZ inheritance tree, searchable)
- Plugin registry (check for updates)

## Links

- VS Marketplace: [link]
- Pro license (Gumroad): [link]
- Discord: https://discord.gg/CDFmWGkfDC

If you run into any issues or have feature requests, drop them in the Discord or comment here.

---

## Notes (internal, don't post)

- Post as image post with 3-4 screenshots showing the most visual features
- Body goes in the first comment or as image captions
- "Thanks for the feedback" ties back to the earlier post and builds continuity
- Reply to every comment in first 3 hours
- Consider crosspost to r/gamedev after 24h if good reception
- Japanese community: Twitter/X post in Japanese separately
- RPG Maker Forums: separate thread in "Plugin Releases"
