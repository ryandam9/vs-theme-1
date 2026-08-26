# my-monokai — Plan

A personal fork of VS Code's built-in **Monokai Dimmed** theme, restructured so colors are
easy to edit, semantic (language-server) colors are explicit, and the result installs
anywhere as a `.vsix`.

---

## Background: why semantic colors behave oddly

Source theme (VS Code 1.134.0, snap install):

```
/snap/code/current/usr/share/code/resources/app/extensions/theme-monokai-dimmed/themes/dimmed-monokai-color-theme.json
```

11 KB, minified onto one line: ~60 workbench `colors` + ~70 `tokenColors` rules.

It ends with `"semanticHighlighting": true` **but contains no `semanticTokenColors` block.**
That is the whole problem. When gopls / Pylance / rust-analyzer send a semantic token,
VS Code has no explicit rule to apply, so it falls back to a built-in map of
*semantic token type -> TextMate scope*, then colors it with whatever `tokenColors` rule
happens to match that scope:

| LSP semantic type | falls back to scope | color in stock theme |
| --- | --- | --- |
| `type`, `struct`, `interface`, `enum` | `entity.name.type*` | `#9B0000` (dark red, poor contrast on `#1e1e1e`) |
| `namespace` | `entity.name.namespace` | `#9B0000` |
| `function` | `entity.name.function` | `#CE6700` |
| `method` | `entity.name.function.member` | *unmatched* -> `#C5C8C6` |
| `variable` | `variable.other.readwrite` | `#6089B4` |
| `parameter` | `variable.parameter` | `#6089B4` |
| `property` | `variable.other.property` | `#9872A2` |
| `enumMember` | `variable.other.enummember` | *unmatched* -> default fg |
| `macro` | `entity.name.function.macro` | *unmatched* -> default fg |

So Go looks different from Python not because the theme differs per language, but because
gopls and Pylance emit **different token types** for the same-looking code, and the theme
never says what those types should be.

**Fix:** add an explicit `semanticTokenColors` map. It takes priority over `tokenColors`,
so behaviour stops depending on which language server is attached.

Precedence, highest wins:

```
editor.semanticTokenColorCustomizations  (settings.json)
  > theme semanticTokenColors
  > default semantic -> TextMate fallback
  > theme tokenColors
```

---

## Phase 0 — Fast experiment loop

Before touching files, override live in `~/.config/Code/User/settings.json`. Applies
instantly, no reload — use it to *decide* colors, Phase 3/4 bakes them in.

```jsonc
"editor.semanticTokenColorCustomizations": {
  "[Monokai Dimmed]": {
    "enabled": true,
    "rules": {
      "type": "#8FBCBB",
      "type:go": "#8FBCBB",
      "variable.readonly": { "foreground": "#AE81FF" },
      "method": "#CE6700"
    }
  }
},
"workbench.colorCustomizations": {
  "[Monokai Dimmed]": { "editor.background": "#1c1c1c" }
}
```

Discovery tool used throughout: **`Developer: Inspect Editor Tokens and Colors`**
(`Ctrl+Shift+P`). Put the cursor on any symbol; it reports the semantic token type +
modifiers, the TextMate scopes, and exactly which theme rule won.

---

## Phase 1 — Scaffold as a real extension

In `/home/ravi/git-repos/my-monokai/`:

- `git init`
- `package.json` declaring `contributes.themes` (id `My Monokai Dimmed`, `uiTheme: vs-dark`)
- `README.md`, `CHANGELOG.md`, `LICENSE`, `.vscodeignore`, `.gitignore`

A color theme extension needs **zero JavaScript at runtime** — no `yo code` required.

---

## Phase 2 — Vendor the base theme, readable

- `src/upstream.json` — pretty-printed, byte-faithful copy of the stock theme. Never edited.
  Diff against it when VS Code updates to see what upstream changed.
- Pretty-printing turns 1 line into ~900, one rule per line, so edits produce readable diffs.

---

## Phase 3 — Palette indirection (the "edit easily" part)

Rather than hunting hex codes across 900 lines:

- `src/palette.json` — ~25 named colors: `{ "red": "#C7444A", "type": "#8FBCBB", ... }`
- `src/theme.jsonc` — the theme, referring to colors as `"$type"`, `"$green"`, `"$bg"`
- `build.js` — small Node script resolving `$refs` -> `themes/my-monokai-dimmed-color-theme.json`

Changing the type color everywhere becomes: edit one line in `palette.json`, `npm run build`.

Rules:
- `$name` resolves to `palette[name]`.
- `$name+CC` appends an alpha suffix (e.g. `"$sel+80"` -> `#676b7180`).
- Build fails loudly on an unknown `$ref` — no silently-black colors.

---

## Phase 4 — Explicit `semanticTokenColors`

The actual fix. Selector syntax is `type.modifier:language`:

```jsonc
"semanticTokenColors": {
  "type": "$type",
  "method": "$function",
  "variable.readonly": { "foreground": "$const" },
  "parameter": "$param",
  "*.declaration": { "fontStyle": "bold" },
  "variable:go": "$var",
  "class:python": "$type"
}
```

Cover every standard LSP type (`namespace type class enum interface struct typeParameter
parameter variable property enumMember event function method macro keyword modifier
comment string number regexp operator decorator`) plus the modifiers that matter
(`declaration definition readonly static deprecated defaultLibrary`), then add
`:go` / `:python` overrides where those servers disagree.

---

## Phase 5 — Dev loop

- Symlink the repo into `~/.vscode/extensions/my-monokai` (or press `F5` for an
  Extension Development Host).
- Theme JSON edits **hot-reload on save** — no window restart.
- `samples/` holds Go / Python / TypeScript / YAML / Markdown files side by side as a
  visual test bed covering every token category at once.

---

## Phase 6 — "Use it anywhere"

Three levels, pick what's needed:

1. **VSIX (no accounts):** `npx @vscode/vsce package` -> `my-monokai-<version>.vsix`, then
   `code --install-extension my-monokai-<version>.vsix` on any machine.
2. **GitHub:** push the repo, attach the `.vsix` to releases.
3. **Registries:** publish to the VS Code Marketplace (needs a publisher ID + Azure DevOps
   PAT) and/or **Open VSX** (for VSCodium / Cursor / Kiro).

Note: the Kiro install at `/usr/share/kiro/...` ships an *older* Monokai Dimmed that still
uses the deprecated `editorIndentGuide.background` key and lacks the `agents*` colors.
Publishing one theme unifies both editors.
