# Changelog

All notable changes to the Chassis Icons project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-04-14

### Added

- **New Icons**: GitHub, X (Twitter), Rocket, and Arrow Up variants (8 new icons total, bringing total to 489 icons)
  - `github-brand` and `github-square-brand`
  - `x-twitter-brand` and `x-twitter-square-brand`
  - `rocket-outline` and `rocket-solid`
  - `arrow-up-from-bracket` (outline and solid)
  - `arrow-up-from-square` (outline and solid)
- **Documentation System**: Complete icon documentation with individual pages, tags, and categories
- **Browse Pages**: Added tag and category browse pages for better icon discovery
- **Example Icon Config**: Added `example_icon` to site configuration

### Changed

- **Build Directory**: Changed output directory from `font/` to `icons/` for clarity (breaking change)
- **Website Architecture**: Major site refactor with component restructuring
  - Converted key sections (BuildSection, SVGSection) from MDX to Astro for better performance
  - Reorganized components from `components/icons/` to `components/sections/`
  - Improved HeroSection and ListSection layouts
- **Dependencies**: Integrated `@chassis-ui/docs` package for shared documentation components
- **Site Structure**: Cleaned up and removed 4,500+ lines of unused code and components
  - Removed unused assets, SCSS, and legacy components
  - Consolidated layout partials and simplified structure
  - Streamlined component organization
- **Icon Naming**: Fixed microchip icon naming consistency (`microchip-outline`, `microchip-solid`)
- **ESLint Configuration**: Consolidated to single configuration file
- **Build Scripts**: Improved icon build pipeline and site generation

### Fixed

- **TypeScript Errors**: Resolved all compilation errors across the site
- **Package Scripts**: Fixed test script missing pnpm prefix
- **Transfer Ownership**: Resolved issues after transferring to @chassis-ui organization
- **Vercel Deployment**: Fixed configuration for proper static site deployment
- **Build Process**: Corrected icon build sequence and dependencies
- **Property References**: Fixed config property names in components (`icons_version` → `current_version`)

### Removed

- **Unused Components**: Removed legacy components (ThemeToggler, NavDocsMenu, Placeholder, etc.)
- **Unused Assets**: Cleaned up application.js, color-modes.js, search.js, stackblitz.js
- **Unused Styles**: Removed 2,000+ lines of unused SCSS (_component-examples, _sidebar, _search, etc.)
- **Legacy Layouts**: Removed BaseLayout, RedirectLayout, and associated partials
- **Duplicate Sections**: Removed duplicate content in documentation

### Documentation

- **README**: Updated all directory paths from `font/` to `icons/`
- **README**: Corrected script names and testing documentation
- **Site Content**: Improved copy with capability-first approach
- **Code Examples**: Enhanced examples with better structure and clarity

### Technical Details

- **Total Icons**: 489 SVG icons (up from ~480 in v0.1.0)
- **Package Size**: Optimized by removing unused dependencies and code
- **Build Performance**: Improved build times through better script organization
- **Code Quality**: Enhanced TypeScript strict checks and ESLint rules
- **Site Performance**: Faster page loads through Astro conversion and code cleanup

## [0.1.0] - 2025-08-25

### Added

- **Project Split**: Separated from chassis-tokens into dedicated icons package
- **Icon Pipeline**: Complete SVG optimization and processing pipeline
- **Font Generation**: Automated icon font creation with Fantasticon
- **SVG Sprites**: Optimized sprite generation for web use
- **Build System**: Comprehensive build scripts for icon processing
- **Preview System**: HTML preview page for icon visualization
- **Distribution**: Automated packaging and distribution setup

### Changed

- **Package Name**: Renamed from `@chassis-ui/tokens` to `@chassis-ui/icons`
- **Focus**: Specialized for icon generation and font creation only
- **Dependencies**: Removed token-related dependencies, kept icon-specific tools
- **Scripts**: Streamlined build scripts for icon-only workflow

### Removed

- **Design Tokens**: Moved to separate `@chassis-ui/tokens` package
- **Assets Management**: Moved to separate `@chassis-ui/assets` package
- **Token Build Scripts**: Removed Style Dictionary and token-related tooling

### Technical Details

- **SVG Optimization**: SVGO integration for clean, optimized icons
- **Font Formats**: WOFF2 and WOFF support for broad browser compatibility
- **CSS Generation**: Automated stylesheet creation with icon classes
- **Sprite Output**: Single SVG sprite file for efficient web delivery

---

## Previous History (chassis-tokens)

### [0.1.0] - 2025-02-15 (Original chassis-tokens release)

- Initial setup of combined tokens/assets/icons project
- Basic configuration files
- Version control with Git
- MIT license
