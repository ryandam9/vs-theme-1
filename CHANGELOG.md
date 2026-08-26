# Changelog

## 1.0.0

Initial fork of VS Code's built-in **Monokai Dimmed** (VS Code 1.134.0).

### Added
- **`semanticTokenColors` block with 47 rules.** Upstream sets `semanticHighlighting: true`
  but defines no semantic rules at all, so gopls / Pylance / rust-analyzer tokens fell
  through to a default *semantic type -> TextMate scope* map. Types, methods, enum members
  and macros were therefore colored differently in each language, and `method` / `enumMember`
  / `macro` matched no rule at all and rendered as plain foreground.
- Language-specific overrides for Go, Python, TypeScript/JavaScript and Rust.
- `*.declaration` bold, `*.static` italic, `*.deprecated` strikethrough.

### Changed
- `entity.name.class` / `entity.name.type` / semantic `type`: `#9B0000` -> `#8FBCBB`.
  The stock dark red scores ~1.5:1 contrast against the `#1E1E1E` editor background, well
  under the 4.5:1 readability threshold, and gopls tags every type with it.
  Set `type` back to `#9B0000` in `src/palette.json` to restore stock.

Everything else is byte-identical to upstream — enforced by `npm run verify`.
