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
| `scripts/derive.js` | builds a full palette from a short one (see *Palette variants*) |
| `scripts/color.js` | OKLCH + WCAG contrast math, no dependencies |
| `scripts/audit.js` | contrast + role-distinctness check across all variants |
| `scripts/preview.js` | renders every variant side by side to `preview.html` |
| `scripts/install-all.sh` | builds, packages and installs every theme in one go |
| `palettes/<name>/` | one self-contained variant extension per palette |
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

## Palette variants

Each directory under `palettes/` is a **standalone theme extension** built from a short
source palette. Pick one, build it, install it:

```sh
cd palettes/bee_eater
npm run install-local        # build + package + install into VS Code
```

Then choose the theme in `Preferences: Color Theme`. Variants install alongside each
other and alongside the base theme, so you can keep all of them and switch freely.

Or install everything at once — the base theme plus all twelve variants:

```sh
npm run install-all
```

```sh
scripts/install-all.sh bee_eater galah   # only these palettes
scripts/install-all.sh -e kiro           # into Kiro / VSCodium / Cursor instead of code
scripts/install-all.sh -n                # build and package only, skip installing
```

```sh
node build.js bee_eater      # build one variant
node build.js --all          # base + every variant
npm run audit                # contrast + distinctness report
npm run preview              # write preview.html: all variants side by side
```

### How a 6-colour palette becomes a 71-colour theme

Only `palettes/<name>/source.json` is hand-written:

```jsonc
{
  "name": "bee_eater",
  "displayName": "Bee-eater",
  "mode": "dark",                    // flip to "light" to invert the whole theme
  "colors": ["#00346E", "#007CBF", "#06ABDF", "#EDD03E", "#F5A200", "#6D8600", "#424D0C"],
  "overrides": {}                    // any palette key here wins over the derived value
}
```

`scripts/derive.js` turns that into the full palette. The rule it follows: **Monokai
Dimmed's lightness architecture is what makes it readable, so keep it and replace only the
hue architecture.**

1. **Anchor.** The darkest source colour that still carries a hue (for a light theme, the
   lightest) becomes what the whole UI is tinted toward — a kookaburra gets a navy
   background, a fairywren a brown one. Override with `"anchor": "#02407c"`.
2. **Surfaces** keep upstream's exact lightness and take the anchor's hue at low chroma, so
   the UI's depth ordering is untouched. In `"light"` mode the background and foreground
   bands are swapped and re-spaced instead.
3. **Syntax roles** snap to the nearest source colour *by hue*, inherit its hue and chroma,
   and keep their own lightness — so strings stay green if the palette has a green, and
   land somewhere sensible if it does not.
4. **Sparse palettes get filled in.** A palette that is one narrow arc (plains-wanderer is
   all browns) or a few tight clusters (oriole is rust / olive / lavender, nothing between)
   cannot carry 20 distinct roles. The arc is extended outward and its interior gaps filled
   with derived analogous hues, at the palette's own spacing. The real colours still win the
   roles nearest them; the derived ones only fill what was missing.
5. **Contrast floors** are enforced against the *derived* background, per role — `8.0` for
   the editor foreground, `4.5` for syntax, `3.2` for comments, `2.4` for punctuation grey.
6. **Roles that still collide** are pushed apart in lightness, and when a hue is carrying
   too many roles to separate that way, in chroma too: same hue, pale to vivid.
7. **Meaning-carrying colours are left alone.** Errors stay red, diff-insert stays green,
   terminal ANSI keeps its hue ordering (nudged 25% toward the palette). These are only
   moved far enough to stay readable on the new background.

`npm run audit` checks the result — every role against its contrast floor, and every pair of
syntax roles against each other. All 12 palettes currently pass both.

The generated `palettes/<name>/palette.json` is written out in the same format as
`src/palette.json`, so a variant is exactly as inspectable as the base theme. To change one
colour, put it in `overrides` and rebuild.

Palettes are from the [feathers](https://github.com/shandiya/feathers) R package
(Australian birds).


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
