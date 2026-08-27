# Blue-winged Kookaburra

A dark recolour of My Monokai Dimmed, derived from the
**Blue-winged Kookaburra** palette:

`#b5effb` `#0b7595` `#02407c` `#06213a` `#c45829` `#9C4620` `#622C14` `#d4d8e3` `#b8bcd8` `#ad8d9f` `#725f77`

Every one of the ~70 theme colours is snapped to the nearest palette colour by hue,
keeps Monokai Dimmed's lightness structure, and is checked against a contrast floor
on the derived background (`#141f2b`).

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Blue-winged Kookaburra** in `Preferences: Color Theme`.

Edit `source.json` (palette, `mode`, or `overrides`) and rebuild.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
