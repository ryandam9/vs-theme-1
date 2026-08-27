# Plains-wanderer

A light recolour of My Monokai Dimmed, derived from the
**Plains-wanderer** palette:

`#edd8c5` `#d09a5e` `#e7aa01` `#ac570f` `#73481b` `#442c0e` `#0d0403`

Every one of the ~70 theme colours is snapped to the nearest palette colour by hue,
keeps Monokai Dimmed's lightness structure, and is checked against a contrast floor
on the derived background (`#fff9f3`).

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Plains-wanderer** in `Preferences: Color Theme`.

Edit `source.json` (palette, `mode`, or `overrides`) and rebuild.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
