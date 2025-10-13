# 🎨 Chassis Icons

> **Icon generator and font builder for Chassis Design System**

[![npm version](https://img.shields.io/npm/v/@chassis-ui/icons.svg)](https://www.npmjs.com/package/@chassis-ui/icons)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **SVG Optimization** - Automated SVG cleaning and optimization with SVGO
- 🖼️ **Sprite Generation** - Creates optimized SVG sprites for web use
- 🔤 **Icon Fonts** - Generates web fonts (WOFF, WOFF2) from SVG icons
- 📱 **CSS & SCSS** - Pre-built stylesheets with icon classes
- 🎨 **Preview Generator** - HTML preview page for all icons
- ⚡ **Build Pipeline** - Automated icon processing and distribution

## 📦 Installation

```bash
# Install the package
npm install @chassis-ui/icons

# Or with pnpm
pnpm install @chassis-ui/icons
```

## 🚀 Quick Start

### Using Pre-built Icons

```html
<!-- Include the CSS -->
<link
  rel="stylesheet"
  href="node_modules/@chassis-ui/icons/icons/package/chassis-icons.css"
/>

<!-- Use icon classes -->
<i class="chassis-icon chassis-icon-home"></i>
<i class="chassis-icon chassis-icon-user"></i>
```

### Using SVG Sprite

```html
<!-- Include the sprite -->
<svg style="display: none;">
  <use
    href="node_modules/@chassis-ui/icons/icons/package/chassis-icons.svg"
  ></use>
</svg>

<!-- Use specific icons -->
<svg class="icon">
  <use href="#chassis-icon-home"></use>
</svg>
```

## 🛠️ Development

### Building Icons

```bash
# Build all icons (SVG optimization, sprite, font generation)
pnpm build

# Build individual components
pnpm icons-main      # Optimize SVG files
pnpm icons-sprite    # Generate SVG sprite
pnpm icons-font      # Generate icon font
pnpm icons-dist      # Copy to distribution folder
```

### Adding New Icons

1. **Add SVG files** to `icons/svgs/` directory
2. **Run the build** process: `pnpm build`
3. **Preview icons** in browser: `pnpm preview`

### Icon Guidelines

- ✅ Use **24x24px** viewBox for consistency
- ✅ **Single color** icons (black fill)
- ✅ **Simplified paths** for better font rendering
- ✅ **Meaningful names** (kebab-case)

## 📁 Project Structure

```
chassis-icons/
├── icons/
│   ├── svgs/              # Source SVG files
│   ├── package/           # Generated files
│   │   ├── chassis-icons.css
│   │   ├── chassis-icons.scss
│   │   ├── chassis-icons.svg
│   │   ├── chassis-icons.woff2
│   │   └── chassis-icons.woff
│   └── preview.html       # Icon preview page
├── build/                 # Build scripts
└── package.json
```

## 🔧 Configuration

### SVG Sprite Config (`svg-sprite.json`)

```json
{
  "mode": {
    "symbol": {
      "dest": "icons/package",
      "sprite": "chassis-icons.svg"
    }
  }
}
```

### Fantasticon Config (`.fantasticonrc.js`)

Icon font generation settings for typeface creation.

## 📋 Available Scripts

| Script              | Description                         |
| ------------------- | ----------------------------------- |
| `pnpm build`        | Build all icons (complete pipeline) |
| `pnpm icons-main`   | Optimize SVG files                  |
| `pnpm icons-sprite` | Generate SVG sprite                 |
| `pnpm icons-font`   | Create icon font files              |
| `pnpm icons-dist`   | Copy files to distribution          |
| `pnpm check`        | Validate icon files                 |
| `pnpm preview`      | Open icon preview in browser        |
| `pnpm release`      | Build and package for release       |

## 🎯 Output Files

After building, you'll find these generated files:

### CSS & SCSS

- `chassis-icons.css` - Complete stylesheet with font definitions
- `chassis-icons.min.css` - Minified version
- `chassis-icons.scss` - SCSS version with variables

### Font Files

- `chassis-icons.woff2` - Modern web font (preferred)
- `chassis-icons.woff` - Legacy web font support

### SVG Sprite

- `chassis-icons.svg` - Complete SVG sprite with all icons

### Preview

- `preview.html` - Visual preview of all available icons

## 🔗 Related Packages

This package is part of the **Chassis Design System**:

- [`@chassis-ui/tokens`](https://github.com/chassis-ui/tokens) - Design tokens
- [`@chassis-ui/assets`](https://github.com/chassis-ui/assets) - Brand assets
- [`@chassis-ui/css`](https://github.com/chassis-ui/css) - CSS framework

## 📄 License

Licensed under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">
  <strong>Built with ❤️ for the Chassis Design System</strong>
</div>
