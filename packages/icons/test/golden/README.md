# @acme/glyphs

The set of another team: the fixture of the tests of the build

The set has 8 icons. Each is drawn on a frame of 16 by 16 in one color, and takes the color of the text around it.

```bash
npm install @acme/glyphs
```

## What the package holds

- `icons/acme-glyphs.css` and `icons/acme-glyphs.min.css`: the stylesheet of the icon font, with one class per icon
- `icons/acme-glyphs.scss`: the same stylesheet for Sass, with the folder of the font and the map of the icons as variables
- `icons/acme-glyphs.woff2`, `icons/acme-glyphs.ttf`: the icon font, which the stylesheets load from their own folder
- `icons/acme-glyphs.svg`: the SVG sprite, one `<symbol>` per icon with the name of the icon as its `id`
- `icons/acme-glyphs.json`: the code point of each icon in the font, by name
- `svgs/<name>.svg`: one optimized file per icon

The last part of a name is the style of the icon: `<name>-line` or `<name>-fill`. The examples below show `bar-fill`.

Browse the icons and their names on the [site of the set](https://glyphs.acme.example/).

## Use

### The icon font

One class per icon, `ag-<name>`, on an empty element:

```html
<link rel="stylesheet" href="node_modules/@acme/glyphs/icons/acme-glyphs.min.css" />

<i class="ag-bar-fill"></i>
```

With a bundler, `import '@acme/glyphs'` loads the same stylesheet and its font.

### The SVG sprite

One file for the whole set, and one `<use>` per icon:

```html
<svg width="16" height="16" fill="currentcolor" aria-hidden="true">
  <use href="node_modules/@acme/glyphs/icons/acme-glyphs.svg#bar-fill"></use>
</svg>
```

### A single SVG file

```html
<img src="node_modules/@acme/glyphs/svgs/bar-fill.svg" alt="" width="16" height="16" />
```

### Sass

The classes of the stylesheet, with the font served from a folder of your own, and the map of the icons for a selector of your own:

```scss
@use 'sass:map';
@use '@acme/glyphs/icons/acme-glyphs.scss' as icons with (
  $acme-glyphs-font-dir: '/fonts'
);

.my-icon::before {
  font-family: icons.$acme-glyphs-font;
  content: map.get(icons.$acme-glyphs-map, 'bar-fill');
}
```

Sass finds the file in a load path that holds `node_modules`, and so does a bundler. With the package importer of Sass, `@use 'pkg:@acme/glyphs'` loads the same file.

## The source

The package is built from the SVG files of its [repository](https://git.acme.example/design/glyphs). An icon is added or changed there, and never in the files of this package.

## License

UNLICENSED
