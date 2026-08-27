# Princess Parrot

A dark recolour of My Monokai Dimmed, derived from the
**Princess Parrot** palette:

`#7090c9` `#8cb3de` `#afbe9f` `#616020` `#6eb245` `#214917` `#cf2236` `#d683ad`

Every one of the ~70 theme colours is snapped to the nearest palette colour by hue,
keeps Monokai Dimmed's lightness structure, and is checked against a contrast floor
on the derived background (`#172115`).

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Princess Parrot** in `Preferences: Color Theme`.

Edit `source.json` (palette, `mode`, or `overrides`) and rebuild.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
