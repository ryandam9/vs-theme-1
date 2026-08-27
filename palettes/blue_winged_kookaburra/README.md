# Blue-winged Kookaburra

A dark VS Code theme inspired directly by the **Blue-winged Kookaburra**, rather than a generic Monokai recolour.

Original Feathers swatches:

`#b5effb` `#0b7595` `#02407c` `#06213a` `#c45829` `#9C4620` `#622C14` `#d4d8e3` `#b8bcd8` `#ad8d9f` `#725f77`

Bird inspiration: https://ryandam.net/blog/2026/06/06/feathers/index.html

## Visual identity

The theme deliberately follows the bird's visual hierarchy instead of distributing every source hue evenly across the editor.

- **Deep navy** (`#081521`) dominates the workbench, matching the dark blue wing/tail shadows.
- **Soft feather cream** (`#D2D0C8`) is the normal source foreground. It is intentionally quieter than the previous `#E2DDD0`, allowing semantic colours to stand out more clearly.
- **Cream strings** (`#D8C7A1`) separate literals from the blue structural syntax and remove the previous Monokai-like cyan-string feel.
- **Pale sky blue** (`#B5EFFB`) is reserved for functions and methods: the brightest coding colour, echoing the bird's spectacular pale-blue wing feathers.
- **Wing blue** (`#4F9FC9`) identifies types/classes, while the softer **steel blue** (`#86AAC4`) handles parameters and numbers. This increases separation between callable, structural, and value-oriented syntax.
- **Blue-grey** (`#98AEBB`) handles properties/namespaces without introducing a purple cast.
- **Pale plumage grey** (`#D4D8E3`) is used for control keywords rather than another saturated hue.
- **Soft rufous** (`#C97450`) identifies `self` / `cls` and special references. It remains distinctive without dominating every line that contains `self`.
- **Turquoise** (`#3E9AB2`) is reserved for decorators and related special structure.
- Comments use a warm neutral (`#9A9188`) rather than blue or brown, staying secondary but comfortably readable.

The intended first impression is therefore:

> **navy + feather cream + brilliant kookaburra blue + small rufous flashes**

This is intentionally different from the base My Monokai Dimmed theme even though both share the same semantic-token architecture.

## Syntax hierarchy

The polish pass deliberately separates the three major blue roles:

| Role | Colour | Visual priority |
| --- | --- | --- |
| Function / method | `#B5EFFB` | Brightest blue; callable focus |
| Type / class | `#4F9FC9` | Strong wing blue; structural |
| Parameter / number | `#86AAC4` | Softer steel blue; supporting values |
| Property / namespace | `#98AEBB` | Muted blue-grey; secondary structure |

## Representative contrast on `#081521`

| Role | Colour | Approx. contrast |
| --- | --- | ---: |
| Normal text | `#D2D0C8` | 11.9:1 |
| Function / method | `#B5EFFB` | 14.7:1 |
| String | `#D8C7A1` | 11.1:1 |
| Control keyword | `#D4D8E3` | 12.9:1 |
| Keyword | `#B7C0C7` | 10.0:1 |
| Property / namespace | `#98AEBB` | 8.0:1 |
| Parameter / number | `#86AAC4` | 7.5:1 |
| Type / class | `#4F9FC9` | 6.3:1 |
| Comment | `#9A9188` | 6.0:1 |
| Rufous special ref | `#C97450` | 5.4:1 |

## Source of truth

The original Feathers swatches remain unchanged in `source.json`. The `overrides` block is the deliberate VS Code role mapping. `palette.json` and the theme JSON are generated artifacts.

## Build and install

```sh
npm run install-local    # build + package + install into VS Code
npm run package          # build + package only
npm run build            # regenerate the theme JSON only
```

Then pick **Blue-winged Kookaburra** in `Preferences: Color Theme`.

Palette from the [feathers](https://github.com/shandiya/feathers) R package.
