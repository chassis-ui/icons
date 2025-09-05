# Bootstrap to Chassis CSS Class Reference

This document provides a mapping of Bootstrap classes to their Chassis CSS equivalents, based on the differences identified during the icon documentation system development.

## Buttons

### Bootstrap → Chassis CSS

```html
<!-- Bootstrap -->
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-outline-primary">Outline Primary</button>
<button class="btn btn-outline-secondary">Outline Secondary</button>
<button class="btn btn-small">Small Button</button>

<!-- Chassis CSS -->
<button class="button primary">Primary Button</button>
<button class="button secondary">Secondary Button</button>
<button class="button primary outline">Outline Primary</button>
<button class="button secondary outline">Outline Secondary</button>
<button class="button small">Small Button</button>
```

### Pattern Differences
- **Bootstrap**: `btn` + modifier classes (`btn-primary`, `btn-outline-primary`, `btn-small`)
- **Chassis CSS**: `button` + space-separated modifiers (`primary`, `outline`, `small`)

## Badges

### Bootstrap → Chassis CSS

```html
<!-- Bootstrap -->
<span class="badge bg-primary">Primary Badge</span>
<span class="badge bg-secondary">Secondary Badge</span>
<span class="badge bg-outline-secondary">Outline Badge</span>

<!-- Chassis CSS -->
<span class="badge primary">Primary Badge</span>
<span class="badge secondary">Secondary Badge</span>
<span class="badge neutral">Neutral Badge</span>
```

### Pattern Differences
- **Bootstrap**: `badge` + background color classes (`bg-primary`, `bg-secondary`)
- **Chassis CSS**: `badge` + color modifier (`primary`, `secondary`, `neutral`)

## Cards

### Bootstrap → Chassis CSS

```html
<!-- Bootstrap -->
<div class="card">
  <div class="card-body">
    <h3 class="card-title">Title</h3>
    <p>Content</p>
  </div>
</div>

<!-- Chassis CSS -->
<div class="card">
  <div class="card-content">
    <h3 class="card-title">Title</h3>
    <p>Content</p>
  </div>
</div>
```

### Pattern Differences
- **Bootstrap**: Uses `card` + `card-body` + `card-title` structure
- **Chassis CSS**: Uses `card` + `card-content` + `card-title` structure (only `card-body` → `card-content`)

## Typography

### Bootstrap → Chassis CSS

```html
<!-- Bootstrap -->
<div class="display-6 text-primary">Large Display Text</div>
<div class="h1">Large Heading</div>

<!-- Chassis CSS -->
<div class="font-display font-6xlarge text-primary">Large Display Text</div>
<div class="font-6xlarge">Large Heading</div>
```

### Pattern Differences
- **Bootstrap**: `display-{number}` for large text sizes
- **Chassis CSS**: `font-{size}` with descriptive size names (`font-6xlarge`, `font-5xlarge`, etc.)
- **Chassis CSS**: Use `font-display` for display fonts combined with size classes

## Layout Classes

### Similarities
These classes are similar or identical between Bootstrap and Chassis CSS:

```html
<!-- Both frameworks use similar patterns -->
<div class="container">
<div class="container-fluid">
<div class="row">
<div class="col-12">
<div class="col-md-6">
```

## Data Attributes

### Bootstrap → Chassis CSS

```html
<!-- Bootstrap -->
<body data-bs-spy="scroll"
      data-bs-target="#nav"
      data-bs-root-margin="0px 0px -25%"
      data-bs-threshold="0.1">

<!-- Chassis CSS -->
<body data-cx-spy="scroll"
      data-cx-target="#nav"
      data-cx-root-margin="0px 0px -25%"
      data-cx-threshold="0.1">
```

### Pattern Differences
- **Bootstrap**: Uses `data-bs-*` prefix
- **Chassis CSS**: Uses `data-cx-*` prefix

## Complete Migration Examples

### Before (Bootstrap)
```html
<div class="card">
  <div class="card-body">
    <h3 class="card-title">Quick Stats</h3>
    <div class="row text-center">
      <div class="col-4">
        <div class="display-6 text-primary">150</div>
        <div class="text-muted">Icons</div>
      </div>
    </div>
    <a href="/browse" class="btn btn-outline-primary btn-small">
      Browse All
      <span class="badge bg-primary ms-2">150</span>
    </a>
  </div>
</div>
```

### After (Chassis CSS)
```html
<div class="card">
  <div class="card-content">
    <h3 class="card-title">Quick Stats</h3>
    <div class="row text-center">
      <div class="col-4">
        <div class="font-display font-6xlarge text-primary">150</div>
        <div class="text-muted">Icons</div>
      </div>
    </div>
    <a href="/browse" class="button primary outline small">
      Browse All
      <span class="badge primary ms-2">150</span>
    </a>
  </div>
</div>
```

## Migration Checklist

- [ ] Replace `btn` with `button`
- [ ] Convert button modifiers from `btn-*` to space-separated (`primary`, `outline`, `small`)
- [ ] Replace `badge bg-*` with `badge {color}`
- [ ] Convert `card-body` to `card-content` (keep `card` and `card-title`)
- [ ] Update `display-*` to `font-display font-*xlarge` for display text
- [ ] Update large text to `font-*xlarge` (e.g., `font-6xlarge`)
- [ ] Change data attributes from `data-bs-*` to `data-cx-*`
- [ ] Keep layout classes (`container`, `row`, `col-*`) as they are

## Notes

1. **Philosophy Difference**:
   - Bootstrap uses specific component classes with modifiers
   - Chassis CSS uses base classes with utility modifiers

2. **Flexibility**:
   - Chassis CSS maintains similar component structure to Bootstrap
   - Cards use the same pattern but with `card-content` instead of `card-body`

3. **Naming**:
   - Chassis CSS uses more descriptive size names (`font-6xlarge` vs `display-6`)
   - Display fonts require both `font-display` and size classes
   - Color modifiers are simpler (`primary` vs `bg-primary`)

4. **Data Attributes**:
   - Only the prefix changes (`bs` → `cx`)
   - All functionality and options remain the same
