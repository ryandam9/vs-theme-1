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

Change `"type": "#7BB75B"` and every type, class, struct, interface and enum updates at
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

`npm run verify` prints every deviation from upstream — 22 at present. `npm run tokens
-- <file.go>` asks gopls what tokens it actually emits and reports which rule colors each
one, with a contrast warning below 4.5:1.

### Current palette

| role | color | contrast |
| --- | --- | --- |
| function / method | `#66D9EF` cyan | 10.11:1 |
| variable | `#C5C8C6` default fg | 9.88:1 |
| builtin type | `#5FC9A8` mint | 8.26:1 |
| string | `#9CBF6E` moss green | 8.01:1 |
| `self` / `cls` | `#E08FE0` light magenta | 7.28:1 |
| class / type | `#7BB75B` green | 6.96:1 |
| keyword | `#8FA3B8` blue-gray | 6.43:1 |
| decorator | `#54A9A9` teal | 6.05:1 |
| namespace | `#A98AB2` purple | 5.53:1 |
| const / readonly | `#8080FF` violet | 5.12:1 |
| parameter | `#6089B4` blue | 4.55:1 |
| comment | `#8A7F6E` taupe | 4.24:1 |

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
  "[My Monokai Dimmed]": { "enabled": true, "rules": { "type": "#7BB75B" } }
}
```

## Development

```sh
npm run link      # symlink into ~/.vscode/extensions, then reload the window once
npm run build     # theme JSON hot-reloads on save afterwards — no restart
npm run verify    # build + diff against upstream
```

Open the files in `samples/` side by side as a visual test.

## Installing on another machine (macOS)

The theme ships as a single `.vsix` file. No Marketplace account, no publisher ID.

### 1. Build the package

On the machine that has this repo:

```sh
git clone git@github.com:ryandam9/vs-theme-1.git my-monokai
cd my-monokai
npm run package
```

That writes `my-monokai-1.0.0.vsix` (about 9 KB) into the repo root. Node 18+ is the only
prerequisite — `brew install node` if the Mac does not have it. There are no runtime
dependencies to install; `npm run package` shells out to `npx @vscode/vsce`, which fetches
the packager on demand.

### 2. Install it

Either from the terminal:

```sh
code --install-extension my-monokai-1.0.0.vsix
```

If `code` is not on your PATH on macOS, open VS Code and run
**Shell Command: Install 'code' command in PATH** from the Command Palette
(`Cmd+Shift+P`) first.

Or entirely through the UI, if you would rather not touch the terminal:

1. `Cmd+Shift+X` to open the Extensions view
2. Click the `...` menu at the top of the panel
3. Choose **Install from VSIX...**
4. Select `my-monokai-1.0.0.vsix`

### 3. Select the theme

`Cmd+K` `Cmd+T`, then pick **My Monokai Dimmed**.

Or set it directly in `~/Library/Application Support/Code/User/settings.json`:

```jsonc
"workbench.colorTheme": "My Monokai Dimmed"
```

### 4. Turn on gopls semantic tokens (Go users)

The theme's semantic rules only fire when the language server sends semantic tokens.
Pylance does by default; **gopls does not**. Add this to the same `settings.json`:

```jsonc
"gopls": { "ui.semanticTokens": true }
```

Then reload the window. Without it, Go falls back to TextMate scopes and types, functions
and namespaces all lose their distinct colors.

### Updating later

```sh
git pull
npm run package
code --install-extension my-monokai-1.0.0.vsix --force
```

`--force` overwrites the installed copy. Reload the window afterwards.

### Skipping the build entirely

If you would rather not run Node on the target Mac, build the `.vsix` once anywhere and
copy the file over — AirDrop, scp, a GitHub release attachment. Step 2 is all the target
machine needs.

### Other editors

The same `.vsix` installs in VSCodium, Cursor and Kiro. Substitute the matching CLI
(`codium`, `cursor`) for `code`, or use the Install from VSIX menu.

### Reloading after a change

| what changed | action |
| --- | --- |
| workbench `colors` | live on save |
| `tokenColors` (TextMate) | live on save |
| `semanticTokenColors` | **reload the window** |

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
