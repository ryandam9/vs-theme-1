# Oriole

A dark recolour of My Monokai Dimmed, derived from the
**Oriole** palette:

`#8a3223` `#bb5645` `#d97878` `#e2aba0` `#d0cfe9` `#a29eb8` `#6c6b75` `#b8a53f` `#93862a` `#4d4019`

Every one of the ~70 theme colours is snapped to the nearest palette colour by hue,
keeps Monokai Dimmed's lightness structure, and is checked against a contrast floor
on the derived background (`#231e0e`).

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Oriole** in `Preferences: Color Theme`.

Edit `source.json` (palette, `mode`, or `overrides`) and rebuild.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
