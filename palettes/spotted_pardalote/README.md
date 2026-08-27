# Spotted Pardalote

A dark recolour of My Monokai Dimmed, derived from the
**Spotted Pardalote** palette:

`#feca00` `#d36328` `#cb0300` `#b4b9b3` `#424847` `#000100`

Every one of the ~70 theme colours is snapped to the nearest palette colour by hue,
keeps Monokai Dimmed's lightness structure, and is checked against a contrast floor
on the derived background (`#2a1916`).

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Spotted Pardalote** in `Preferences: Color Theme`.

Edit `source.json` (palette, `mode`, or `overrides`) and rebuild.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
