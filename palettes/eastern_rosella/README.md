# Eastern Rosella

A dark recolour of My Monokai Dimmed, derived from the
**Eastern Rosella** palette:

`#cd3122` `#f4c623` `#bee183` `#6c905e` `#2f533c` `#b8c9dc` `#2f7ab9`

Every one of the ~70 theme colours is snapped to the nearest palette colour by hue,
keeps Monokai Dimmed's lightness structure, and is checked against a contrast floor
on the derived background (`#132218`).

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Eastern Rosella** in `Preferences: Color Theme`.

Edit `source.json` (palette, `mode`, or `overrides`) and rebuild.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
