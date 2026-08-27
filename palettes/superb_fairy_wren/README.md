# Superb Fairywren

A dark recolour of My Monokai Dimmed, derived from the
**Superb Fairywren** palette:

`#4F3321` `#AA7853` `#D9C4A7` `#B03F05` `#020503`

Every one of the ~70 theme colours is snapped to the nearest palette colour by hue,
keeps Monokai Dimmed's lightness structure, and is checked against a contrast floor
on the derived background (`#281b13`).

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Superb Fairywren** in `Preferences: Color Theme`.

Edit `source.json` (palette, `mode`, or `overrides`) and rebuild.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
