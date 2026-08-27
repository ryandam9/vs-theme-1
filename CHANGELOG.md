# Changelog

## Unreleased

### Added

- **Palette variants.** `palettes/<name>/` is a self-contained theme extension generated
  from a short source palette; `cd palettes/<name> && npm run install-local` builds,
  packages and installs it. Twelve palettes ship, two of them light themes.
- **`scripts/derive.js`** — expands a 5-11 colour palette into the full 71-colour palette.
  Keeps Monokai Dimmed's lightness structure, snaps each role to the nearest source colour
  by hue, extends sparse palettes with derived analogous hues, and enforces per-role
  contrast floors against the derived background.
- **`scripts/color.js`** — OKLCH conversion, sRGB gamut clipping and WCAG contrast, no
  dependencies.
- **`scripts/audit.js`** (`npm run audit`) — checks every variant's roles against their
  contrast floors and against each other for visual collisions.
- **`scripts/preview.js`** (`npm run preview`) — renders every variant side by side to
  `preview.html`.
- **`scripts/install-all.sh`** (`npm run install-all`) — builds, packages and installs the
  base theme and every variant in one go. Takes palette names to narrow it down, `-e <bin>`
  to target Kiro / VSCodium / Cursor, `-n` to package without installing.
- `node build.js <palette>` and `node build.js --all`.

### Changed

- `build.js` now resolves `src/theme.jsonc` against any palette rather than only
  `src/palette.json`. The base theme output is byte-identical.

## 1.0.0

A fork of VS Code's built-in **Monokai Dimmed** (VS Code 1.134.0).

### Added

- **`semanticTokenColors` with 44 rules.** Upstream sets `semanticHighlighting: true` but
  defines no semantic rules at all, so gopls / Pylance / rust-analyzer tokens fell through
  to a default *semantic type -> TextMate scope* map. Types, methods, enum members and
  macros were colored differently in each language, and `method` / `enumMember` / `macro`
  matched no rule and rendered as plain foreground.
- Language-specific overrides for Go, Python, TypeScript/JavaScript and Rust, including
  `selfParameter:python`, `clsParameter:python` and `function.decorator`.
- TextMate fallbacks for Python `self` / `cls` and decorators, so they keep their colors
  when Pylance is not running.
- `*.declaration` bold, `*.static` italic, `*.deprecated` strikethrough.
- Dedicated palette entries so shared colors can be tuned independently: `keyword`,
  `keywordControl`, `selfRef`, `decoratorRef`, `type`.

### Changed

Coarse categories — `keyword`, `modifier`, `comment`, `string`, `number`, `regexp`,
`operator` — were deliberately left out of `semanticTokenColors`. TextMate grammars
distinguish `keyword.control` from `keyword`, while LSP collapses both into `keyword`;
letting the grammar own them preserves the dimmed/accent split the theme is built around.

Palette, with contrast against the `#1E1E1E` editor background:

| role | from | to | contrast |
| --- | --- | --- | --- |
| class / type | `#9B0000` | `#7BB75B` green | 1.51:1 -> 6.96:1 |
| function / method | `#CE6700` | `#66D9EF` cyan | 4.42:1 -> 10.11:1 |
| string | `#9AA83A` | `#9CBF6E` moss green | 6.38:1 -> 8.01:1 |
| `self` / `cls` | `#C7444A` | `#E08FE0` light magenta | 3.46:1 -> 7.28:1 |
| decorator | `#D9B700` | `#54A9A9` teal | 8.51:1 -> 6.05:1 |
| builtin type | `#408080` | `#5FC9A8` mint | 3.67:1 -> 8.26:1 |
| keyword | `#676867` | `#8FA3B8` blue-gray | 2.98:1 -> 6.43:1 |
| namespace / storage | `#9872A2` | `#A98AB2` purple | 4.18:1 -> 5.53:1 |
| comment | `#9A9B99` | `#8A7F6E` taupe | 5.97:1 -> 4.24:1 |

Every color was checked two ways: contrast against the background, and CIE Lab distance
against every other syntax color. Nothing sits closer than dE 12 to a neighbour, and the
only color under 4.5:1 is `comment`, which is meant to recede.

Everything else is identical to upstream — enforced by `npm run verify`, which lists all
22 deviations.

### Tooling

- `npm run build` — resolve `src/palette.json` + `src/theme.jsonc` into the theme
- `npm run verify` — build, then diff against a pristine copy of upstream
- `npm run tokens -- <file.go>` — ask gopls what it actually emits and report which rule
  colors each token, flagging anything below 4.5:1
- `npm run package` / `npm run link` — build a `.vsix`, or symlink for development
