# 🎨 Chassis Icons Foundation

> **A complete toolkit for building custom icon libraries for your Chassis-based design system**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is **not a ready-to-use icon library**. It's a foundation and automation tool that helps you quickly create a custom icon library tailored to your specific design system or application. The existing 488+ icons are examples from the Chassis design system and should be replaced with your own icons.

## ✨ What This Tool Provides

- 🎯 **Automated Build Pipeline** - Transform your SVG icons into production-ready formats
- 🖼️ **SVG Sprite Generation** - Create optimized SVG sprites automatically
- 🔤 **Icon Font Generation** - Generate web fonts (WOFF, WOFF2) from your icons
- 📱 **Multi-Format Output** - CSS, SCSS, SVG, font files, and JSON metadata
- 🎨 **Live Preview Generator** - Interactive HTML page to browse your icon library
- ⚡ **SVG Optimization** - Automated SVGO processing with smart defaults
- 📚 **Documentation Site** - Astro-powered documentation template for your icons
- 🔍 **Quality Validation** - Automated testing for icon consistency

## 🚀 Quick Start

### 1. Clone and Setup Your Project

```bash
# Clone this repository as a template for your project
git clone https://github.com/chassis-ui/icons.git my-design-system-icons
cd my-design-system-icons

# Remove the git history to start fresh
rm -rf .git
git init

# Install dependencies
pnpm install
```

### 2. Customize for Your Project

```bash
# Update package.json with your project details
# Change: name, description, repository, homepage, author, keywords
nano package.json
```

**Key fields to update:**
```json
{
  "name": "@your-org/your-project-icons",
  "description": "Icon library for Your Design System",
  "repository": "https://github.com/your-org/your-project-icons.git",
  "homepage": "https://your-design-system.com",
  "author": "Your Name <your.email@example.com>",
  "chassis": {
    "defaults": {
      "iconPrefix": "your-icon",  // Change prefix to match your brand
      "iconFormat": "woff2"
    },
    "icons": {
      "sprite": "your-icons.svg",  // Customize output names
      "font": "your-icons",
      "preview": "preview.html"
    }
  }
}
```

### 3. Add Your Icons

```bash
# Remove the example Chassis icons
rm -rf svgs/*.svg

# Add your design system's SVG icons to the svgs/ directory
# You can copy them from your design files (Figma, Sketch, Adobe XD, etc.)
cp /path/to/your/icons/*.svg svgs/
```

**Icon Requirements:**
- ✅ 24x24px viewBox (or consistent size across all icons)
- ✅ Single color (black fill, paths will be replaced with CSS)
- ✅ Optimized/simplified paths
- ✅ Kebab-case naming (e.g., `home-outline.svg`, `user-solid.svg`)

### 4. Build Your Icon Library

```bash
# Generate everything: optimized SVGs, sprite, fonts, CSS
pnpm icons

# Preview your icons
open icons/preview.html
```

### 5. Integrate into Your Project

```bash
# Option A: Copy generated files to your project
cp -r icons/* /path/to/your-project/assets/icons/

# Option B: Publish as a private npm package
pnpm build
npm publish
```

## 💡 Usage in Your Design System

Once you've built your custom icon library, you can use it in multiple ways:

### Using Icon Font (CSS)

```html
<!-- Include your generated CSS -->
<link rel="stylesheet" href="path/to/your-icons.css" />

<!-- Use icon classes (prefix matches your config) -->
<i class="your-icon your-icon-home-solid"></i>
<i class="your-icon your-icon-user-outline"></i>
```

### Using SVG Sprite

```html
<!-- Reference your sprite -->
<svg class="icon">
  <use href="path/to/your-icons.svg#home-solid"></use>
</svg>

<!-- With custom size -->
<svg class="icon" width="32" height="32">
  <use href="path/to/your-icons.svg#logo-brand"></use>
</svg>
```

### Using Individual SVG Files

```html
<!-- Import individual optimized SVG -->
<img src="svgs/bell-outline.svg" alt="Notifications" />
```

### Using in SCSS

```scss
@import 'path/to/your-icons.scss';

// Custom icon styling
.my-icon {
  @extend .your-icon;
  @extend .your-icon-rocket-solid;
  font-size: 2rem;
  color: var(--brand-color);
}
```

## 🛠️ Working with Your Icon Library

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Building Your Icons

```bash
# Complete build: icons + documentation site
pnpm build

# Build icons only (SVG optimization, sprite, and font generation)
pnpm icons

# Build individual components
pnpm icons:svgs      # Optimize SVG files with SVGO
pnpm icons:sprite    # Generate SVG sprite
pnpm icons:font      # Generate icon fonts (WOFF, WOFF2)
pnpm icons:font-min  # Minify CSS output
```

### Development Server

```bash
# Start Astro development server (port 4324)
pnpm dev

# Or use Astro commands directly
pnpm astro:dev       # Start dev server
pnpm astro:build     # Build for production
pnpm astro:preview   # Preview production build
```

### Documentation Site

```bash
# Build documentation pages
pnpm site:pages

# Build complete site
pnpm site:build

# Lint site code
pnpm site:lint
```

### Testing & Quality Checks

```bash
# Run all tests
pnpm test

# Individual checks
pnpm test:icons      # Validate icon files
pnpm test:eslint     # JavaScript/TypeScript linting
pnpm test:stylelint  # SCSS linting
pnpm test:vnu        # HTML validation
pnpm test:audit      # Security audit
pnpm test:fusv       # Find unused SASS variables
```

### Adding More Icons

1. **Export icons from your design tool** (Figma, Sketch, Adobe XD, etc.)
   - Export as SVG
   - Use 24x24px artboard/frame
   - Flatten shapes and use single color

2. **Add SVG files** to the `svgs/` directory
   - Use kebab-case naming (e.g., `arrow-right-outline.svg`)
   - Follow consistent naming convention across your library

3. **Run the build process**
   ```bash
   pnpm icons
   ```

4. **Preview your updated library**
   - Open `font/preview.html` in your browser
   - Or run `pnpm dev` to see them in the documentation site

### Icon Naming Convention

Establish a consistent naming pattern for your icons. Common patterns:

**By Style Variant:**
- `{name}-outline.svg` - Outlined/stroke style
- `{name}-solid.svg` - Filled/solid style
- `{name}-brand.svg` - Brand/logo icons

**Examples:**
- `home-outline.svg` / `home-solid.svg`
- `arrow-right-outline.svg` / `arrow-right-solid.svg`
- `company-logo-brand.svg`

**Pro Tips:**
- Be consistent across your entire library
- Use descriptive names that make sense for your team
- Group related icons with common prefixes
- Document your naming convention in your design system

## 📁 Project Structure

```
your-icon-library/
├── svgs/                  # YOUR SVG icon source files
│   ├── home-outline.svg   # Replace with your icons
│   ├── home-solid.svg
│   ├── user-outline.svg
│   └── ...
├── icons/                  # Generated output (committed to repo)
│   ├── your-icons.css     # Generated stylesheet
│   ├── your-icons.min.css # Minified CSS
│   ├── your-icons.scss    # SCSS with variables
│   ├── your-icons.svg     # SVG sprite
│   ├── your-icons.woff2   # Modern web font
│   ├── your-icons.woff    # Legacy web font
│   ├── your-icons.json    # Icon metadata
│   └── preview.html       # Interactive preview page
├── site/                  # Documentation website (Astro)
│   ├── src/
│   │   ├── components/   # Reusable Astro components
│   │   ├── layouts/      # Page layouts
│   │   ├── pages/        # Documentation pages
│   │   ├── libs/         # Utility libraries
│   │   └── scss/         # Documentation styles
│   ├── content/          # MDX content files
│   ├── public/           # Static assets
│   └── astro.config.ts   # Astro configuration
├── build/                # Build automation scripts (DO NOT MODIFY)
│   ├── build-svgs.js    # SVG optimization with SVGO
│   ├── build-icons.js   # Icon font generation
│   ├── build-pages.js   # Page generation
│   ├── build-site.js    # Site builder
│   ├── check-icons.js   # Icon validation
│   └── zip-icons.js     # Release packaging
├── vendor/               # Third-party assets (optional)
├── .fantasticonrc.cjs   # Icon font configuration - CUSTOMIZE THIS
├── svg-sprite.json      # SVG sprite configuration - CUSTOMIZE THIS
├── svgo.config.js       # SVGO optimization rules - CUSTOMIZE THIS
└── package.json         # Project config - UPDATE WITH YOUR DETAILS
```

## 🔧 Configuration

### Essential Customizations

After cloning this project for your design system, you should customize these configuration files:

### 1. Package Configuration (`package.json`)

Update project metadata and icon naming:

```json
{
  "name": "@your-org/your-project-icons",
  "version": "0.1.0",
  "description": "Icon library for Your Design System",
  "repository": "https://github.com/your-org/your-project-icons.git",
  "homepage": "https://your-design-system.com",
  "author": "Your Name <your.email@example.com>",
  "chassis": {
    "defaults": {
      "iconPrefix": "your-icon",     // CSS class prefix
      "iconFormat": "woff2"
    },
    "icons": {
      "sprite": "your-icons.svg",     // Output sprite filename
      "font": "your-icons",            // Output font family name
      "preview": "preview.html"
    }
  }
}
```

### 2. Icon Font Configuration (`.fantasticonrc.cjs`)

Customize font generation settings - this is where you define:
- Font family name
- CSS class prefixes
- Output file names
- Font formats (WOFF, WOFF2)
- Template customization

### 3. SVG Sprite Configuration (`svg-sprite.json`)

Adjust sprite generation settings for your needs:
- Output paths
- Sprite mode (symbol, stack, etc.)
- ID prefixes

### 4. SVG Optimization (`svgo.config.js`)

Fine-tune SVGO optimization for your icons:
- Which plugins to enable/disable
- Precision settings
- Attribute cleanup rules

**💡 Tip:** The default configurations work well for most projects, but you can customize them to match your design system's specific requirements.

## 📋 Available Scripts

### Main Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Complete build: icons + documentation site |
| `pnpm dev` | Start Astro dev server on port 4324 |
| `pnpm release` | Build everything and create release package |
| `pnpm test` | Run all quality checks and tests |

### Icon Generation

| Command | Description |
|---------|-------------|
| `pnpm icons` | Build all icons (SVG → sprite + fonts) |
| `pnpm icons:svgs` | Optimize SVG files with SVGO |
| `pnpm icons:sprite` | Generate SVG sprite file |
| `pnpm icons:font` | Generate icon fonts (WOFF/WOFF2) |
| `pnpm icons:font-main` | Generate unminified CSS |
| `pnpm icons:font-min` | Minify CSS output |
| `pnpm icons:zip` | Package icons for distribution |

### Documentation Site

| Command | Description |
|---------|-------------|
| `pnpm site:pages` | Generate documentation pages |
| `pnpm site:build` | Build complete documentation site |
| `pnpm site:lint` | Run all site linting checks |
| `pnpm site:format` | Format site code with Prettier |
| `pnpm astro:dev` | Start Astro development server |
| `pnpm astro:build` | Build Astro site for production |
| `pnpm astro:preview` | Preview production build |

### Testing & Quality

| Command | Description |
|---------|-------------|
| `pnpm test:icons` | Validate icon files and structure |
| `pnpm test:eslint` | Lint JavaScript/TypeScript code |
| `pnpm test:stylelint` | Lint SCSS stylesheets |
| `pnpm test:vnu` | Validate HTML output |
| `pnpm test:audit` | Run security audit on dependencies |
| `pnpm test:fusv` | Find unused SASS variables |
| `pnpm site:lint:eslint` | Lint site code with ESLint |
| `pnpm site:lint:prettier` | Check site code formatting |
| `pnpm site:lint:stylelint` | Lint site SCSS files |
| `pnpm site:lint:vnu` | Validate site HTML |

### Utilities

| Command | Description |
|---------|-------------|
| `pnpm change-version` | Update version across files |
| `pnpm sync-submodules` | Sync Git submodules |

## 🎯 Output Files

After running `pnpm icons`, you'll find these generated files in the `font/` directory:

### Stylesheets

- **`your-icons.css`** - Complete stylesheet with font-face definitions and icon classes
- **`your-icons.min.css`** - Minified version for production use
- **`your-icons.scss`** - SCSS source with variables for customization

### Font Files

- **`your-icons.woff2`** - Modern web font format (recommended, best compression)
- **`your-icons.woff`** - Legacy web font format (IE11+ support)

### SVG Assets

- **`your-icons.svg`** - Complete SVG sprite containing all your icons
- **`your-icons.json`** - Icon metadata with codepoints and names

### Preview

- **`preview.html`** - Interactive HTML page showcasing all your icons with search and copy functionality

### Documentation Site

After running `pnpm build`, the complete documentation site is generated in `_site/` directory, ready for deployment to your hosting platform.

**💡 Commit these generated files** to your repository so they're version-controlled and easily distributed to your team or published as a package.

## 🔗 Related Projects

This tool is part of the **Chassis Design System** ecosystem:

- **[@chassis-ui/css](https://github.com/chassis-ui/css)** - Core CSS framework and components
- **[@chassis-ui/tokens](https://github.com/chassis-ui/tokens)** - Design tokens and variables
- **[@chassis-ui/docs](https://github.com/chassis-ui/docs)** - Documentation utilities and components

## 🌐 About Chassis

Chassis is a modular design system framework that provides tools and foundations for building custom design systems. This icon library generator is designed to work seamlessly with Chassis-based projects but can be adapted for any design system.

**Learn more:** [https://chassis-ui.com](https://chassis-ui.com)

## 🛠️ Technology Stack

- **Build Tool**: Node.js with custom build scripts
- **Documentation**: Astro 5.x with MDX support
- **Font Generation**: @twbs/fantasticon
- **SVG Optimization**: SVGO
- **SVG Sprites**: svg-sprite
- **Code Quality**: ESLint, Stylelint, Prettier
- **Type Safety**: TypeScript
- **Package Manager**: pnpm

## 🤝 Contributing

This is a tool/foundation project. Contributions that improve the build system, add new features, or enhance the documentation are welcome!

### How to Contribute

1. **Fork this repository** to create your own icon library
2. **Report issues** if you find bugs in the build system or tools
3. **Suggest improvements** for the automation pipeline or documentation template
4. **Share feedback** on how you're using this tool for your design system

### Development Workflow

```bash
# Fork and clone
git clone https://github.com/your-username/icons.git
cd icons
pnpm install

# Make your changes to build scripts or documentation

# Test thoroughly
pnpm test

# Submit a pull request
git checkout -b feature/your-improvement
git commit -m 'feat: add amazing improvement'
git push origin feature/your-improvement
```

### What This Project Is NOT

- ❌ A ready-to-use icon library
- ❌ A collection of universal icons
- ❌ A place to submit individual icon designs

### What This Project IS

- ✅ A tool for creating custom icon libraries
- ✅ A build system and automation framework
- ✅ A documentation template for icon libraries
- ✅ A starting point for design system icon workflows

## 📄 License

Licensed under the [MIT License](LICENSE).

Copyright (c) 2025 Chassis UI

**When you use this tool:** You're free to use, modify, and distribute your own icon library created with this tool under your own license. The MIT license applies to this build system and tooling, not to the icon designs you create.

## 👨‍💻 Author

**Ozgur Gunes**
- Email: o.gunes@gmail.com
- GitHub: [@ozgurgunes](https://github.com/ozgurgunes)

---

<div align="center">
  <strong>Build Your Custom Icon Library with Confidence</strong>
  <br />
  <sub>A foundation tool for Chassis Design System projects</sub>
  <br />
  <sub>Made with Astro, TypeScript, and modern web standards</sub>
</div>
