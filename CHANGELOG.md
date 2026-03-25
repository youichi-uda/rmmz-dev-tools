# Changelog

## [1.1.4] - 2026-03-25

### Fixed

- Fix `Game_Action.itemTargetCandidates` return type to `(Game_Actor | Game_Enemy)[]` (#10)
- Add `Sprite.dy` and `Sprite.ry` properties used by `Sprite_Damage` (#9)
- Fix `RMMZ_Window.initialize` signature to allow `Window_Base` override (#8)
- Add `id` property to `RPG_MapInfo` type definition (#7)
- Add index signature to `Game_BattlerBase` and `TextManager` for dynamic access (#6)
- Fix annotation tag regex to trim trailing whitespace
- Fix class hierarchy scanner to detect multi-line constructor patterns
- Fix annotation preview to preserve focus when opening beside editor

### Changed

- Remove internal docs from repository

## [1.1.3] - 2026-03-24

### Fixed

- Add missing `@type` values: `icon`, `color`, `map`, `location` (#1)
- Support multi-dimensional array types like `number[][]` (#2)
- Fix `Game_Party.maxItems` type definition — parameter is now optional (#3)
- Fix RMMZ `Window` class conflicting with DOM `Window` interface (#4)
- Trigger auto-build on `*.d.ts` file saves in `ts/typings/` (#5)

## [0.1.0] - 2026-03-17

### Added

- Annotation syntax highlighting for `/*:`, `/*:ja`, and `/*~struct~` blocks
- Context-aware `@tag` completion (scope-sensitive: top-level, @param, @command, @arg, struct)
- `@type` value completion with descriptions (22+ types including database and struct)
- Real-time annotation validation (unknown tags, invalid types, scope violations, type mismatches)
- Hover documentation for all annotation tags and type values
- IntelliSense one-click setup (`jsconfig.json` generation with MZ project detection)
- Debugger one-click setup (`launch.json` for NW.js, auto-repair of `package.json` chromium-args)
- Plugin template generator with interactive prompts
