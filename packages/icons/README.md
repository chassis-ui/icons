# @chassis-ui/icons

The icons of the Chassis Design System, in outline, solid and brand styles, as an icon font, an SVG sprite and optimized SVG files.

The set has 501 icons. Each is drawn on a frame of 24 by 24 in one color, and takes the color of the text around it.

```sh
npm install @chassis-ui/icons
```

## What the package holds

- `icons/chassis-icons.css` and `icons/chassis-icons.min.css`: the stylesheet of the icon font, with one class per icon
- `icons/chassis-icons.scss`: the same stylesheet for Sass, with the folder of the font and the map of the icons as variables
- `icons/chassis-icons.woff2`, `icons/chassis-icons.woff`: the icon font, which the stylesheets load from their own folder
- `icons/chassis-icons.svg`: the SVG sprite, one `<symbol>` per icon with the name of the icon as its `id`
- `icons/chassis-icons.json`: the code point of each icon in the font, by name
- `svgs/<name>.svg`: one optimized file per icon

The last part of a name is the style of the icon: `<name>-outline`, `<name>-solid` or `<name>-brand`. The examples below show `alarm-clock-outline`.

Browse the icons and their names on the [site of the set](https://chassis-ui.com/icons/).

## Use

### The icon font

One class per icon, `cx-<name>`, on an empty element:

```html
<link rel="stylesheet" href="node_modules/@chassis-ui/icons/icons/chassis-icons.min.css" />

<i class="cx-alarm-clock-outline"></i>
```

With a bundler, `import '@chassis-ui/icons'` loads the same stylesheet and its font.

### The SVG sprite

One file for the whole set, and one `<use>` per icon:

```html
<svg width="24" height="24" fill="currentcolor" aria-hidden="true">
  <use href="node_modules/@chassis-ui/icons/icons/chassis-icons.svg#alarm-clock-outline"></use>
</svg>
```

### A single SVG file

```html
<img src="node_modules/@chassis-ui/icons/svgs/alarm-clock-outline.svg" alt="" width="24" height="24" />
```

### Sass

The classes of the stylesheet, with the font served from a folder of your own, and the map of the icons for a selector of your own:

```scss
@use 'sass:map';
@use '@chassis-ui/icons/icons/chassis-icons.scss' as icons with (
  $chassis-icons-font-dir: '/fonts'
);

.my-icon::before {
  font-family: icons.$chassis-icons-font;
  content: map.get(icons.$chassis-icons-map, 'alarm-clock-outline');
}
```

Sass finds the file in a load path that holds `node_modules`, and so does a bundler. With the package importer of Sass, `@use 'pkg:@chassis-ui/icons'` loads the same file.

## The source

The package is built from the SVG files of its [repository](https://github.com/chassis-ui/icons). An icon is added or changed there, and never in the files of this package.

## License

MIT
