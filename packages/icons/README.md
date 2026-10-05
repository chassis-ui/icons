# @chassis-ui/icons

The icons of the [Chassis Design System](https://chassis-ui.com): about 500 icons in outline, solid and brand styles, as an icon font, an SVG sprite and single SVG files. Every icon is drawn on a 24 by 24 frame in one color, and takes the color of the text around it.

```sh
npm install @chassis-ui/icons
```

## What the package holds

| Folder   | Files                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------- |
| `icons/` | `chassis-icons.css`, `chassis-icons.min.css` and `chassis-icons.scss`: the classes of the icon font |
| `icons/` | `chassis-icons.woff2` and `chassis-icons.woff`: the icon font, loaded by the stylesheets beside it  |
| `icons/` | `chassis-icons.svg`: the SVG sprite, one `<symbol>` per icon with the name of the icon as its `id`  |
| `icons/` | `chassis-icons.json`: the code point of each icon in the font, by name                              |
| `svgs/`  | `<name>.svg`: one optimized file per icon                                                           |

An icon is named `<name>-outline`, `<name>-solid` or `<name>-brand`, such as `bell-outline`. Browse the names on the [icons site](https://chassis-ui.com/icons/).

## Use

The icon font, with one class per icon:

```html
<link rel="stylesheet" href="node_modules/@chassis-ui/icons/icons/chassis-icons.min.css" />

<i class="cx-bell-outline"></i>
```

The SVG sprite:

```html
<svg width="24" height="24" fill="currentcolor">
  <use href="node_modules/@chassis-ui/icons/icons/chassis-icons.svg#bell-outline"></use>
</svg>
```

A single SVG file:

```html
<img src="node_modules/@chassis-ui/icons/svgs/bell-outline.svg" alt="Notifications" />
```

Sass, with the font files served from your own folder:

```scss
@use '@chassis-ui/icons/icons/chassis-icons' with (
  $chassis-icons-font-dir: '/fonts'
);
```

## Your own icons

Chassis Icons is meant to be owned and customized: clone the [repository](https://github.com/chassis-ui/icons), replace the SVG files in `source/`, and build your own font, sprite and SVG files. See its [README](https://github.com/chassis-ui/icons#readme).
