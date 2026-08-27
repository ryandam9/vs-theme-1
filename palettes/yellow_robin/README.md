# Yellow Robin

A dark recolour of My Monokai Dimmed, derived from the
**Yellow Robin** palette:

`#E19E00` `#FBEB5B` `#85773A` `#979EB9` `#727B98` `#454B56` `#201B1E`

Every one of the ~70 theme colours is snapped to the nearest palette colour by hue,
keeps Monokai Dimmed's lightness structure, and is checked against a contrast floor
on the derived background (`#221e0e`).

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Yellow Robin** in `Preferences: Color Theme`.

Edit `source.json` (palette, `mode`, or `overrides`) and rebuild.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
