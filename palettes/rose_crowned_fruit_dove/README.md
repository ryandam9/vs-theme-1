# Rose-crowned Fruit Dove

A dark recolour of My Monokai Dimmed, derived from the
**Rose-crowned Fruit Dove** palette:

`#BD338F` `#EB8252` `#F5DC83` `#CDD4DC` `#8098A2` `#8FA33F` `#5F7929` `#014820`

Every one of the ~70 theme colours is snapped to the nearest palette colour by hue,
keeps Monokai Dimmed's lightness structure, and is checked against a contrast floor
on the derived background (`#142217`).

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Rose-crowned Fruit Dove** in `Preferences: Color Theme`.

Edit `source.json` (palette, `mode`, or `overrides`) and rebuild.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
