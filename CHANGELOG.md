# Changelog

All notable changes to the Chassis Icons project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- **Package Name**: Renamed from `@ozgurgunes/chassis-tokens` to `@ozgurgunes/chassis-icons`
- **Focus**: Specialized for icon generation and font creation only
- **Dependencies**: Removed token-related dependencies, kept icon-specific tools
- **Scripts**: Streamlined build scripts for icon-only workflow

### Removed

- **Design Tokens**: Moved to separate `@ozgurgunes/chassis-tokens` package
- **Assets Management**: Moved to separate `@ozgurgunes/chassis-assets` package
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
