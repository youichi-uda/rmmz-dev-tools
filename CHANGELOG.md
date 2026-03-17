# Changelog

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
