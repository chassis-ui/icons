# 🎨 Chassis Icons Development Guide

## 📋 Project Overview

**Chassis Icons** is a specialized icon generator and font builder that was split from the `chassis-tokens` project. It focuses exclusively on SVG icon processing, optimization, sprite generation, and web font creation.

### **Split Details (August 25, 2025)**

- **Origin**: Extracted from `@ozgurgunes/chassis-tokens`
- **Purpose**: Dedicated icon processing and font generation
- **Scope**: SVG optimization, sprite creation, icon fonts

## 🏗️ Architecture

### **Core Components**

```
chassis-icons/
├── icons/
│   ├── svgs/              # Source SVG icons (478 icons)
│   ├── package/           # Generated distribution files
│   └── preview.html       # Icon preview page
├── build/                 # Build scripts and tools
│   ├── build-icons.js     # Fantasticon wrapper
│   ├── build-svgs.js      # SVG optimization
│   ├── copy-icons.js      # Distribution copying
│   ├── zip-icons.js       # Release packaging
│   └── font/              # Font template files
└── .fantasticonrc.js      # Icon font configuration
```

### **Build Pipeline**

1. **SVG Optimization** (`build-svgs.js`) - SVGO processing
2. **Sprite Generation** (`svg-sprite`) - Creates consolidated SVG sprite
3. **Font Generation** (`build-icons.js`) - Fantasticon font creation
4. **Distribution** (`copy-icons.js`) - File organization and copying

## 🔧 Development Workflow

### **Adding New Icons**

```bash
# 1. Add SVG files to svgs/
cp new-icon.svg svgs/

# 2. Build all icons
pnpm build

# 3. Preview results
pnpm preview  # Opens preview.html in browser
```

### **Icon Guidelines**

- ✅ **24x24px viewBox** for consistency
- ✅ **Single color** (black fill, no strokes)
- ✅ **Optimized paths** (simplified geometry)
- ✅ **Kebab-case naming** (e.g., `arrow-right-outline.svg`)
- ✅ **Meaningful prefixes** (`-outline`, `-solid`, `-circle`)

### **Testing Changes**

```bash
# Lint and format code
pnpm validate

# Build and verify
pnpm build
pnpm check  # Validates icon files

# Test specific steps
pnpm icons-main     # SVG optimization only
pnpm icons-sprite   # Sprite generation only
pnpm icons-font     # Font generation only
```

## 📦 Distribution Files

### **Generated Outputs**

```
font/
├── chassis-icons.css      # Complete stylesheet (32KB)
├── chassis-icons.min.css  # Minified stylesheet (29KB)
├── chassis-icons.scss     # SCSS with variables (18KB)
├── chassis-icons.svg      # SVG sprite (316KB)
├── chassis-icons.woff2    # Modern font (34KB)
├── chassis-icons.woff     # Legacy font (42KB)
├── chassis-icons.json     # Icon codepoint mapping (15KB)
└── codepoints.json        # Source codepoint mapping
```

### **CSS Classes**

```css
/* Base icon class */
.chassis-icon

/* Specific icon classes */
.chassis-icon-home
.chassis-icon-user-outline
.chassis-icon-check-circle-solid
/* ... 478 total icons */
```

## 🚀 CI/CD Pipeline

### **GitHub Actions Workflows**

#### **CI Pipeline** (`.github/workflows/ci.yml`)

```yaml
Triggers: push, pull_request
Matrix: Node.js 18.x, 20.x
Steps: 1. Checkout code
  2. Setup Node.js + pnpm
  3. Install dependencies
  4. Lint validation
  5. Build icons
  6. Verify outputs
  7. Upload artifacts
```

#### **Release Pipeline** (`.github/workflows/release.yml`)

```yaml
Triggers: release published, manual workflow
Steps: 1. Build distribution
  2. Create zip package
  3. Publish to npm
  4. Upload release assets
```

### **Quality Checks**

- ✅ **Icon count validation** (minimum 400 icons)
- ✅ **File generation verification** (CSS, fonts, sprite)
- ✅ **Code formatting** (Prettier + ESLint)
- ✅ **Build artifact testing**

## 🔄 Version Management

### **Release Process**

```bash
# 1. Update version
pnpm release-version  # Updates package.json and template files

# 2. Build and package
pnpm release  # Runs build + zip

# 3. Create GitHub release
# (Triggers automatic npm publish)
```

### **Version Locations**

- `package.json` - Main version
- `build/font/css.hbs` - CSS header version
- `build/font/scss.hbs` - SCSS header version

## 🛠️ Configuration Files

### **Package Configuration**

```json
// package.json
{
  "name": "@ozgurgunes/chassis-icons",
  "main": "font/chassis-icons.css",
  "files": [
    "font/*.{woff,woff2,css,scss,svg,json}",
    "svgs/*.svg"
  ]
}
```

### **Icon Font Configuration**

```javascript
// .fantasticonrc.cjs
{
  inputDir: './svgs',
  outputDir: './fonts',
  name: 'chassis-icons',
  prefix: 'chassis-icon',
  fontTypes: ['woff2', 'woff'],
  assetTypes: ['css', 'scss', 'json']
}
```

### **SVG Sprite Configuration**

```json
// svg-sprite.json
{
  "mode": {
    "symbol": {
      "dest": "icons/package",
      "sprite": "chassis-icons.svg"
    }
  }
}
```

## 📊 Project Statistics

### **Current Status**

- **478 Icons** - Complete icon library
- **7 Output Formats** - CSS, SCSS, WOFF2, WOFF, SVG, JSON, HTML
- **~500KB Total** - Distribution package size
- **Node.js 18+** - Minimum requirements
- **MIT License** - Open source

### **Performance Metrics**

- **Build Time**: ~2 seconds (all icons)
- **Font Size**: 34KB (WOFF2), 42KB (WOFF)
- **CSS Size**: 32KB (full), 29KB (minified)
- **SVG Sprite**: 316KB (all icons)

## 🔗 Integration Examples

### **Web Usage**

```html
<!-- Include CSS -->
<link rel="stylesheet" href="chassis-icons.css" />

<!-- Use icon classes -->
<i class="chassis-icon chassis-icon-home"></i>
<i class="chassis-icon chassis-icon-user-outline"></i>
```

### **SVG Sprite Usage**

```html
<!-- Include sprite -->
<svg style="display: none;">
  <use href="chassis-icons.svg"></use>
</svg>

<!-- Use icons -->
<svg class="icon">
  <use href="#chassis-icon-home"></use>
</svg>
```

### **SCSS Usage**

```scss
@import 'chassis-icons';

.my-icon {
  @extend .chassis-icon;
  @extend .chassis-icon-custom;
}
```

## 🎯 Future Enhancements

### **Planned Features**

- [ ] **Icon Categories** - Organize icons by purpose
- [ ] **Size Variants** - Multiple icon sizes (16px, 24px, 32px)
- [ ] **Color Variants** - Multi-color icon support
- [ ] **React Components** - Auto-generated React icon components
- [ ] **Vue Components** - Auto-generated Vue icon components

### **Technical Improvements**

- [ ] **Incremental Builds** - Only rebuild changed icons
- [ ] **Tree Shaking** - Include only used icons
- [ ] **CDN Distribution** - Direct CDN hosting
- [ ] **Icon Optimization** - Advanced SVGO configurations

---

<div align="center">
  <strong>Chassis Icons v0.1.0 - Built for the Chassis Design System</strong>
</div>
