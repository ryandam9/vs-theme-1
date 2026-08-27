# Bee-eater

A dark recolour of My Monokai Dimmed, derived from the
**Bee-eater** palette:

`#00346E` `#007CBF` `#06ABDF` `#EDD03E` `#F5A200` `#6D8600` `#424D0C`

Every one of the ~70 theme colours is snapped to the nearest palette colour by hue,
keeps Monokai Dimmed's lightness structure, and is checked against a contrast floor
on the derived background (`#151f2b`).

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Bee-eater** in `Preferences: Color Theme`.

Edit `source.json` (palette, `mode`, or `overrides`) and rebuild.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
