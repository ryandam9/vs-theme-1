# Blue-winged Kookaburra

A dark recolour of My Monokai Dimmed inspired by the **Blue-winged Kookaburra**.

Original Feathers swatches:

`#b5effb` `#0b7595` `#02407c` `#06213a` `#c45829` `#9C4620` `#622C14` `#d4d8e3` `#b8bcd8` `#ad8d9f` `#725f77`

Bird inspiration: https://ryandam.net/blog/2026/06/06/feathers/index.html

## Design direction

The first generated version spread the source hues too evenly across the UI. That made the
workbench visibly blue-grey and gave syntax a strong purple/pink cast. The redesign treats the
bird itself as the hierarchy:

- **Midnight navy** (`#101922`) is the quiet editor canvas.
- **Cream-grey plumage** (`#d4d8e3`) is normal text and UI foreground.
- **Wing blue / turquoise** (`#0b7595`, `#6fbece`, `#8dd7e6`) is concentrated on focus,
  types, functions and other structural code.
- **Rufous / warm brown** (`#c45829`, `#d28a5f`, `#d6a675`) is reserved for the cursor,
  literals and special syntax.
- Muted grey replaces the previous brown-heavy comments so comments remain secondary but
  comfortably readable.

The original Feathers swatches remain unchanged in `source.json`; explicit `overrides` map them
into useful VS Code roles. This keeps the theme traceable to its bird inspiration without asking
the automatic hue derivation to make every semantic decision.

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Blue-winged Kookaburra** in `Preferences: Color Theme`.

Edit `source.json` (palette, `mode`, or `overrides`) and rebuild.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
