# Chassis Icons

> A complete toolkit for building custom icon libraries for Chassis-based design systems.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version: 0.3.1](https://img.shields.io/badge/Version-0.3.1-blue.svg)](https://github.com/chassis-ui/icons)

## Overview

This is **not a ready-to-use icon library**. It's a foundation and automation tool that helps you quickly create a custom icon library tailored to your specific design system or application. The icons in `svgs/`, about 500 of them, are examples from the Chassis design system and should be replaced with your own icons.

## Repository Layout

```text
source/               The SVG files you save, one per icon. The build only reads them
packages/icons/       The published package: the build and its output
  svgs/               Output: the optimized SVG files
  icons/              Output: the icon font, its stylesheets and the SVG sprite
  codepoints.json     The code point of each icon, and the retired ones. Written by the build
  build/              The build, as cli.js and its modules, and the templates of the stylesheets
  test/               The tests of the build, with the set of another team as their fixture
packages/site/        The documentation site (Astro)
build/                Scripts of the repository: site pages, the changeset check, release notes and archive
chassis.checks.json   The icons that consumers of the set read by name
```

Run every command from the root of the repository.

## Features

- 🎯 **Automated Build Pipeline** - Transform your SVG icons into production-ready formats
- 🖼️ **SVG Sprite Generation** - Create optimized SVG sprites automatically
- 🔤 **Icon Font Generation** - Generate web fonts (WOFF, WOFF2) from your icons
- 📱 **Multi-Format Output** - CSS, SCSS, SVG, font files, and JSON metadata
- 🎨 **Preview Page** - HTML page that shows every icon of your library
- ⚡ **SVG Optimization** - Automated SVGO processing with smart defaults
- 📚 **Documentation Site** - Astro-powered documentation template for your icons
- 🔍 **Quality Validation** - Automated testing for icon consistency

## Quick Start

> [!WARNING]
> This project uses `pnpm` for package management. Install it globally with `npm install -g pnpm` before running the commands below.

### 1. Clone and Setup Your Project

```bash
# Clone this repository as a template for your project
git clone https://github.com/chassis-ui/icons.git my-design-system-icons
cd my-design-system-icons

# Keep the repository, and point it at your own remote
git remote rename origin upstream
git remote add origin https://github.com/your-org/your-project-icons.git

# Install dependencies
pnpm install
```

Keep the Git repository of the clone. The documentation site reads its fonts and images from the `vendor/assets` submodule, which a new `git init` does not have.

### 2. Describe Your Set

Everything that is particular to your set is in `packages/icons/package.json`: the details of the package, and the `chassis.build` block that the build reads.

```json
{
  "name": "@your-org/your-project-icons",
  "description": "Icon library for Your Design System",
  "repository": "https://github.com/your-org/your-project-icons.git",
  "homepage": "https://your-design-system.com",
  "author": "Your Name <your.email@example.com>",
  "chassis": {
    "build": {
      "name": "your-icons",
      "prefix": "yi",
      "frame": 24,
      "styles": ["outline", "solid"],
      "pairs": [["outline", "solid"]],
      "startCodepoint": "f101",
      "formats": ["woff2", "woff"],
      "header": ["Your Icons v{version}", "Copyright 2026 Your Org"]
    }
  }
}
```

With this block the font is `your-icons`, its files are `your-icons.css`, `your-icons.woff2` and so on, and the class of an icon is `yi-<name>`. See [Configuration](#configuration) for each setting.

The build writes the rest of what the package says about itself: the fields `main`, `style`, `sass`, `files`, `exports` and `sideEffects`, which name the files of your font, and `packages/icons/README.md`, which shows how to use your icons. See [The package](#the-package).

### 3. Add Your Icons

```bash
# Remove the example Chassis icons, and their pages on the documentation site
rm source/*.svg
rm -r packages/site/content/icons

# Add your design system's SVG icons to the source/ directory
# You can copy them from your design files (Figma, Sketch, Adobe XD, etc.)
cp /path/to/your/icons/*.svg source/

# Start a new set: empty the output and the registry of code points
pnpm icons:init
```

`pnpm icons:init` removes the output and the code points of the Chassis icons, so that your first icon gets the first code point. Run it once, before the first build of your set.

The build only reads `source/`. It writes the optimized files, without their `fill` attributes, to `packages/icons/svgs/`, and removes a file there whose source is gone.

**Icon Requirements:**

- ✅ One frame for every icon: a `viewBox` of `0 0 24 24`, or of the `frame` you configured
- ✅ Single color, and filled shapes: outline every stroke
- ✅ Optimized/simplified paths
- ✅ Kebab-case naming that ends in one of your `styles` (e.g., `home-outline.svg`, `user-solid.svg`)

### 4. Build Your Icon Library

```bash
# Check your files: names, frame, color, pairs
pnpm icons:lint:source

# Generate everything: optimized SVGs, sprite, fonts, CSS
pnpm icons

# Check that the output is what the source builds
pnpm icons:verify

# Write one page per icon for the documentation site
pnpm site:pages

# Preview your icons
open packages/icons/icons/preview.html
```

`chassis.checks.json`, at the root, lists the icons that the Chassis sites and Chassis React read by name, and `pnpm icons:verify` fails when one is missing. Empty its `contracts`, or list the icons that your own projects read.

The documentation site draws its own interface with icons of the Chassis set, by name. With another set, those icons are missing from the header and the home page until you change the names.

### 5. Integrate into Your Project

```bash
# Option A: Copy generated files to your project
cp -r packages/icons/icons/* /path/to/your-project/assets/icons/

# Option B: Publish it as an npm package
pnpm icons:lint:package
cd packages/icons
npm publish
```

The release workflow does the second for you when a new version reaches `main`, and attaches `<font>-<version>.zip` to the GitHub release. With `"private": true` in `packages/icons/package.json` it publishes nothing, and the release is the archive. See [The package](#the-package), and [Releases](.github/CONTRIBUTING.md#releases) in the contributing guide.

## Usage in Your Design System

Once you've built your custom icon library, you can use it in multiple ways:

### Using Icon Font (CSS)

```html
<!-- Include your generated CSS -->
<link rel="stylesheet" href="path/to/chassis-icons.css" />

<!-- One class per icon: the prefix and the name of the SVG file -->
<i class="cx-home-solid"></i>
<i class="cx-user-outline"></i>
```

### Using SVG Sprite

```html
<!-- Reference your sprite -->
<svg class="icon" width="24" height="24">
  <use href="path/to/chassis-icons.svg#home-solid"></use>
</svg>

<!-- With custom size -->
<svg class="icon" width="32" height="32">
  <use href="path/to/chassis-icons.svg#github-brand"></use>
</svg>
```

### Using Individual SVG Files

```html
<!-- Import individual optimized SVG -->
<img src="svgs/bell-outline.svg" alt="Notifications" />
```

### Using in SCSS

```scss
@use 'sass:map';

// The classes of the CSS file, with the font files loaded from your own folder
@use 'path/to/chassis-icons' as icons with (
  $chassis-icons-font-dir: '/fonts'
);

// An icon on a selector of your own, from the map of names and code points
.my-icon::before {
  font-family: icons.$chassis-icons-font;
  font-size: 2rem;
  color: var(--brand-color);
  content: map.get(icons.$chassis-icons-map, 'rocket-solid');
}
```

## Working with Your Icon Library

### Prerequisites

- Node.js >= 22.12.0 (`.nvmrc` names the version that CI uses)
- pnpm, the version in `packageManager` of `package.json`
- Git LFS, for the `vendor/assets` submodule that the documentation site needs

### Building Your Icons

```bash
# Complete build: icons + documentation site
pnpm build

# Build icons only (SVG optimization, sprite, and font generation)
pnpm icons

# Run one step
pnpm icons:svgs      # Optimize the files of source/ into packages/icons/svgs/
pnpm icons:sprite    # Write the SVG sprite
pnpm icons:font      # Write the icon font, its stylesheets and the code points
pnpm icons --only package   # Write the README and the fields of package.json

# List the files that a build would change, and change none
pnpm icons --dry-run
```

`pnpm icons` runs `node build/cli.js build` in `packages/icons/`. `node packages/icons/build/cli.js --help` shows every command and option.

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
# The tests of the build
pnpm test

# Individual checks
pnpm icons:lint:source     # Every file of source/ can be an icon
pnpm icons:verify          # The committed output is what the source builds
pnpm icons:typecheck       # Types of the build
pnpm icons:lint            # Lint the build scripts and their tests
pnpm lint:prettier         # Formatting of the whole repository
pnpm site:lint:eslint      # JavaScript/TypeScript linting
pnpm site:lint:stylelint   # SCSS linting
pnpm site:lint:html        # HTML validation with html-validate
pnpm site:lint:vnu         # HTML validation with the Nu Html Checker (needs Java)
pnpm site:lint:fusv        # Find unused SASS variables
```

### Adding More Icons

1. **Export icons from your design tool** (Figma, Sketch, Adobe XD, etc.)
   - Export as SVG
   - Use 24x24px artboard/frame
   - Flatten shapes and use single color

2. **Add SVG files** to the `source/` directory
   - Use kebab-case naming (e.g., `arrow-right-outline.svg`)
   - Follow consistent naming convention across your library

3. **Run the build process**

   ```bash
   pnpm icons
   pnpm site:pages
   ```

4. **Preview your updated library**
   - Open `packages/icons/icons/preview.html` in your browser
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

## Configuration

### The `chassis.build` block

The build reads one block of `packages/icons/package.json`. A setting that the block leaves out has the default of the table, and a setting that the build does not know stops it.

| Setting          | Default                       | What it sets                                                                                      |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `name`           | required                      | The name of the font, and of every file of `icons/`: `<name>.css`, `<name>.svg`, `<name>.woff2`   |
| `prefix`         | required                      | What a class starts with: `<prefix>-<icon>`. Also the class of each SVG file                      |
| `source`         | `"../../source"`              | The folder of your SVG files, from the package                                                    |
| `checks`         | `"../../chassis.checks.json"` | The file of the icons that others read by name, from the package. It may not exist                |
| `frame`          | `24`                          | The width and the height of the frame an icon is drawn on                                         |
| `styles`         | `[]`                          | The last part a name may have, such as `["outline", "solid"]`. Any kebab-case name when empty     |
| `pairs`          | `[]`                          | The styles an icon comes in together, such as `[["outline", "solid"]]`                            |
| `startCodepoint` | `"f101"`                      | The code point of the first icon of a new set, in the Private Use Area (`e000` to `f8ff`)         |
| `formats`        | `["woff2", "woff"]`           | The font formats, in the order of the `src` of the font face: `woff2`, `woff`, `ttf`              |
| `header`         | `[]`                          | The lines of the comment at the top of each stylesheet. `{version}` is the version of the package |

### The package

The other fields of `packages/icons/package.json` describe the package, and the build and the release workflow read them.

| Field                                                      | Who writes it | What it does                                                                                                                 |
| ---------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `name`, `version`                                          | You           | The package that the release workflow publishes, and the `{version}` of `header`. `pnpm changeset:version` bumps the version |
| `description`, `homepage`, `repository`, `license`         | You           | Shown in `packages/icons/README.md`: the first paragraph, the link to your site, the link to the source, the license         |
| `main`, `style`, `sass`, `files`, `exports`, `sideEffects` | The build     | Name the files of the font. An entry of `files` or `exports` that is not about `icons/` or `svgs/` is yours, and is kept     |
| `private`                                                  | You           | With `true`, the release workflow publishes nothing, and the release is the tag and the archive on GitHub                    |
| `publishConfig`                                            | You           | Read by npm when it publishes: `access`, and `provenance`. Set `provenance` to `false` to publish from your own machine      |

`pnpm icons:lint:package` checks with [publint](https://publint.dev) that the fields point at files that the package holds.

### The templates

`packages/icons/build/templates/css.hbs` and `scss.hbs` are Handlebars templates. Change them to change what the stylesheets hold. They get `name`, `prefix`, `header`, `formats`, `fontSrc`, `fontHash` and `codepoints` from the build.

`readme.hbs` is the template of `packages/icons/README.md`. It gets `packageName`, `description`, `homepage`, `repository` and `license` from `package.json`, `name`, `prefix`, `frame`, `styles` and `formats` from the configuration, the number of icons as `count`, and the first icon as `icon`.

### The code points

`packages/icons/codepoints.json` is the registry of the code points, and the build is its only writer. An icon keeps its code point for as long as it is in the set. A new icon gets the next free one, and never moves another. The code point of a removed icon is retired: no later icon gets it. Commit the file with the output.

### SVG optimization

`packages/icons/build/optimize.js` holds the one SVGO configuration of the build, for the files and for the symbols of the sprite.

## Available Scripts

### Main Commands

| Command        | Description                                         |
| -------------- | --------------------------------------------------- |
| `pnpm build`   | Complete build: icons + documentation site          |
| `pnpm dev`     | Start Astro dev server on port 4324                 |
| `pnpm release` | Build everything and write the archive of the icons |
| `pnpm test`    | Run the tests of the build                          |

### Icon Generation

| Command             | Description                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `pnpm icons`        | Build the whole output: SVG files, sprite, font and stylesheets       |
| `pnpm icons:svgs`   | Optimize the files of `source/` with SVGO into `packages/icons/svgs/` |
| `pnpm icons:sprite` | Write the SVG sprite                                                  |
| `pnpm icons:font`   | Write the icon font, its stylesheets and the code points              |
| `pnpm icons:init`   | Empty the output and the registry of code points, to start a new set  |

### Documentation Site

| Command              | Description                       |
| -------------------- | --------------------------------- |
| `pnpm site:pages`    | Generate documentation pages      |
| `pnpm site:build`    | Build complete documentation site |
| `pnpm site:lint`     | Run all site linting checks       |
| `pnpm astro:dev`     | Start Astro development server    |
| `pnpm astro:build`   | Build Astro site for production   |
| `pnpm astro:preview` | Preview production build          |

### Testing & Quality

| Command                    | Description                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm icons:test`          | Run the tests of the build                                                              |
| `pnpm icons:test:golden`   | Write the golden output of the tests again, after a change that is meant to change it   |
| `pnpm icons:verify`        | Check that the committed output is what the source builds, and that no code point moved |
| `pnpm icons:lint:source`   | Check the files of `source/`: names, frame, color, pairs                                |
| `pnpm icons:lint:package`  | Check with publint what npm would publish                                               |
| `pnpm icons:typecheck`     | Type-check the build                                                                    |
| `pnpm icons:lint`          | Lint the build scripts and their tests                                                  |
| `pnpm lint:prettier`       | Check the formatting of the whole repository                                            |
| `pnpm site:lint:eslint`    | Lint JavaScript/TypeScript code                                                         |
| `pnpm site:lint:stylelint` | Lint SCSS stylesheets                                                                   |
| `pnpm site:lint:html`      | Validate HTML output with html-validate                                                 |
| `pnpm site:lint:vnu`       | Validate HTML output with the Nu Html Checker                                           |
| `pnpm site:lint:prettier`  | Check the formatting of the site                                                        |
| `pnpm site:lint:fusv`      | Find unused SASS variables                                                              |
| `pnpm check:astro`         | Type-check the site                                                                     |
| `pnpm check:pnpm`          | Run security audit on the dependencies a consumer installs                              |

### Utilities

| Command                  | Description                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `pnpm changeset`         | Describe a change to the package for the next release                                |
| `pnpm changeset:version` | Make the next version: bump it, write the CHANGELOG entry, update version references |
| `pnpm changeset:check`   | Check that the commits since a base, such as `develop`, come with a changeset        |
| `pnpm release:archives`  | Write `.cache/release/<font>-<version>.zip` with `icons/` and `svgs/` in it          |
| `pnpm release:notes`     | Print the CHANGELOG entry of the version, as the GitHub release shows it             |
| `pnpm vendor`            | Check out and build the `vendor/assets` submodule at the pinned commit               |
| `pnpm sync-submodules`   | Move `vendor/assets` to the latest `app/docs` and build it                           |

## Output Files

After running `pnpm icons`, you'll find the optimized SVG files in `packages/icons/svgs/`, the registry of the code points in `packages/icons/codepoints.json`, the README of the package in `packages/icons/README.md`, and these generated files in `packages/icons/icons/`. They are named after the font, `chassis-icons` for the default set:

### Stylesheets

- **`chassis-icons.css`** - Complete stylesheet with font-face definitions and icon classes
- **`chassis-icons.min.css`** - Minified version for production use
- **`chassis-icons.scss`** - SCSS source with variables for customization

### Font Files

- **`chassis-icons.woff2`** - Modern web font format (recommended, best compression)
- **`chassis-icons.woff`** - Legacy web font format (IE11+ support)

### SVG Assets

- **`chassis-icons.svg`** - Complete SVG sprite containing all your icons
- **`chassis-icons.json`** - The code point of each icon, by name

### Preview

- **`preview.html`** - HTML page that shows every icon of the sprite. It is not committed

### Documentation Site

After running `pnpm build`, the complete documentation site is generated in `_site/` directory, ready for deployment to your hosting platform.

**💡 Commit these generated files** to your repository so they're version-controlled and easily distributed to your team or published as a package.

## Chassis Ecosystem

This project is part of the Chassis Design System's multi-repository architecture:

| Project                                                  | Description                                          |
| -------------------------------------------------------- | ---------------------------------------------------- |
| [chassis-website](https://github.com/chassis-ui/website) | Main website and shared documentation package        |
| [chassis-css](https://github.com/chassis-ui/css)         | CSS framework and component library                  |
| [chassis-tokens](https://github.com/chassis-ui/tokens)   | Design token generation and management               |
| **chassis-icons**                                        | **Icon library and build toolkit (this repository)** |
| [chassis-assets](https://github.com/chassis-ui/assets)   | Multi-platform asset management                      |
| [chassis-figma](https://github.com/chassis-ui/figma)     | Figma component documentation                        |

All documentation sites share the `@chassis-ui/docs` package for consistent layouts, components, and styling.

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for the dev setup, the conventions, what a pull request needs before merge, and how a version is released.

1. Fork the repository
2. Create a feature branch from `develop`: `git checkout -b feature/my-feature develop`
3. Make your changes
4. Test the build: `pnpm build && pnpm test`
5. Add a changeset if `source/`, the build or the output in `packages/icons/` changed: `pnpm changeset`
6. Commit your changes: `git commit -m "feat: add my feature"`
7. Push to the branch: `git push origin feature/my-feature`
8. Open a Pull Request against `develop`

## License

MIT License — see [LICENSE](LICENSE) file for details.
