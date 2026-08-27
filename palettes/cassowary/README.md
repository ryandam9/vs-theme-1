# Cassowary

A dark recolour of My Monokai Dimmed, derived from the
**Cassowary** palette:

`#BDA14D` `#3EBCB6` `#0169C4` `#153460` `#D5114E` `#A56EB6` `#4B1C57` `#09090C`

Every one of the ~70 theme colours is snapped to the nearest palette colour by hue,
keeps Monokai Dimmed's lightness structure, and is checked against a contrast floor
on the derived background (`#241a27`).

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Cassowary** in `Preferences: Color Theme`.

Edit `source.json` (palette, `mode`, or `overrides`) and rebuild.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
