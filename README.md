# My Monokai Dimmed

A personal fork of VS Code's built-in **Monokai Dimmed**, restructured so colors are easy
to edit and semantic (language-server) highlighting is explicit and consistent across
languages.

## Why this exists

The stock theme sets `"semanticHighlighting": true` but ships **no `semanticTokenColors`
block**. When gopls, Pylance or rust-analyzer sends a semantic token, VS Code falls back to
a built-in *semantic type -> TextMate scope* map and colors it with whatever `tokenColors`
rule happens to match. Consequences:

- `method`, `enumMember` and `macro` matched **no rule at all** and rendered as plain text.
- Every `type` fell through to `entity.name.type` = `#9B0000` — about **1.5:1 contrast**
  against the `#1E1E1E` background, far below the 4.5:1 readability threshold.
- The same construct looked different in Go vs Python, because the two servers emit
  different token types.

This fork adds 47 explicit `semanticTokenColors` rules, which take priority over
`tokenColors`, so coloring no longer depends on which language server is attached.

## Editing colors

Everything lives in one file:

```
src/palette.json     <- edit here
```

Change `"type": "#8FBCBB"` and every type, class, struct, interface and enum updates at
once. Then:

```sh
npm run build
```

`src/theme.jsonc` references the palette as `"$type"`, or `"$sel+80"` to append an alpha
suffix. An unknown `$ref` **fails the build** rather than silently producing black.

### Layout

| path | role |
| --- | --- |
| `src/palette.json` | named colors — the file you actually edit |
| `src/theme.jsonc` | theme structure, colors written as `$refs` |
| `src/upstream.json` | pristine copy of the stock theme; never edited |
| `build.js` | resolves refs -> `themes/…json` |
| `scripts/verify.js` | diffs the build against upstream |
| `scripts/refify.js` | one-time re-scaffold against a newer upstream |
| `samples/` | Go/Python/TS/Markdown/YAML visual test bed |

`npm run verify` prints every deviation from upstream. Right now there is exactly one:
the `#9B0000` -> `#8FBCBB` type color.

## Finding out what to change

`Ctrl+Shift+P` -> **`Developer: Inspect Editor Tokens and Colors`**, then put the cursor on
any symbol. It reports the semantic token type + modifiers, the TextMate scopes, and which
theme rule won. Semantic selectors are `type.modifier:language`, e.g. `variable.readonly:go`.

Precedence, highest first:

```
editor.semanticTokenColorCustomizations  (settings.json)
  > theme semanticTokenColors
  > default semantic -> TextMate fallback
  > theme tokenColors
```

To experiment without rebuilding, override live in `settings.json` — no reload needed:

```jsonc
"editor.semanticTokenColorCustomizations": {
  "[My Monokai Dimmed]": { "enabled": true, "rules": { "type": "#8FBCBB" } }
}
```

## Development

```sh
npm run link      # symlink into ~/.vscode/extensions, then reload the window once
npm run build     # theme JSON hot-reloads on save afterwards — no restart
npm run verify    # build + diff against upstream
```

Open the files in `samples/` side by side as a visual test.

## Installing anywhere

```sh
npm run package                                   # -> my-monokai-1.0.0.vsix
code --install-extension my-monokai-1.0.0.vsix    # on any machine
```

The `.vsix` needs no account and works in VS Code, VSCodium, Cursor and Kiro. To publish
to a registry instead, set a real `publisher` in `package.json`, then
`npx @vscode/vsce publish` (VS Code Marketplace, needs an Azure DevOps PAT) or
`npx ovsx publish` (Open VSX).

## Upgrading against a newer VS Code

```sh
python3 -m json.tool --indent 2 \
  /snap/code/current/usr/share/code/resources/app/extensions/theme-monokai-dimmed/themes/dimmed-monokai-color-theme.json \
  > src/upstream.json
git diff src/upstream.json          # see what Microsoft changed
```

Port anything relevant into `src/theme.jsonc` by hand, or re-run `node scripts/refify.js`
to regenerate it (this overwrites hand edits — commit first).

## License

MIT. Derived from VS Code's Monokai Dimmed, (c) Microsoft Corporation, MIT.
