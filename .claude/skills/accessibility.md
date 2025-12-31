# Accessibility (a11y) Skill

## Overview
Accessibility rules from Ultracite for creating inclusive UI components.

## ARIA Rules

### No aria-hidden on Focusable Elements
```typescript
// ❌ Bad
<button aria-hidden="true">Click</button>

// ✅ Good
<button>Click</button>
// or hide non-focusable
<div aria-hidden="true">Decorative content</div>
```

### Valid ARIA Roles Only
```typescript
// ❌ Bad - abstract role
<div role="widget">...</div>

// ✅ Good - specific role
<div role="button">...</div>
<div role="dialog">...</div>
```

### Required ARIA Attributes
```typescript
// ❌ Bad - missing aria-label for icon button
<button><Icon /></button>

// ✅ Good
<button aria-label="Close dialog"><Icon /></button>
```

### Interactive Roles Need Focus
```typescript
// ❌ Bad
<div role="button" onClick={handleClick}>Click</div>

// ✅ Good
<div role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
  Click
</div>
```

## Semantic HTML

### Use Semantic Elements Over Roles
```typescript
// ❌ Bad
<div role="button">Click</div>
<div role="navigation">...</div>

// ✅ Good
<button type="button">Click</button>
<nav>...</nav>
```

### No Redundant Roles
```typescript
// ❌ Bad - button already has role="button"
<button role="button">Click</button>

// ✅ Good
<button type="button">Click</button>
```

## Interactive Elements

### Click + Keyboard Handlers
```typescript
// ❌ Bad - keyboard users can't activate
<div onClick={handleClick}>Click me</div>

// ✅ Good
<div
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
  tabIndex={0}
  role="button"
>
  Click me
</div>

// Better - use button
<button type="button" onClick={handleClick}>Click me</button>
```

### Mouse + Focus Handlers
```typescript
// ❌ Bad
<div onMouseOver={showTooltip} onMouseOut={hideTooltip}>
  Hover me
</div>

// ✅ Good
<div
  onMouseOver={showTooltip}
  onMouseOut={hideTooltip}
  onFocus={showTooltip}
  onBlur={hideTooltip}
  tabIndex={0}
>
  Hover me
</div>
```

## Form Elements

### Labels Required
```typescript
// ❌ Bad
<input type="text" />

// ✅ Good
<label>
  Name
  <input type="text" />
</label>
// or
<label htmlFor="name">Name</label>
<input id="name" type="text" />
```

### Valid Autocomplete
```typescript
// ❌ Bad
<input type="text" autoComplete="full-name" />

// ✅ Good
<input type="text" autoComplete="name" />
<input type="email" autoComplete="email" />
```

## Images and Media

### Meaningful Alt Text
```typescript
// ❌ Bad
<Image alt="image" src="..." />
<Image alt="photo of user" src="..." />

// ✅ Good
<Image alt="John Smith presenting at React Conf 2024" src="..." />
// Decorative images
<Image alt="" src="..." role="presentation" />
```

### SVG Titles
```typescript
// ❌ Bad
<svg viewBox="0 0 24 24">
  <path d="..." />
</svg>

// ✅ Good
<svg viewBox="0 0 24 24" aria-labelledby="iconTitle">
  <title id="iconTitle">Settings</title>
  <path d="..." />
</svg>
```

## TabIndex Rules

### No Positive TabIndex
```typescript
// ❌ Bad - disrupts natural tab order
<button tabIndex={5}>Click</button>

// ✅ Good
<button tabIndex={0}>Click</button>
<button tabIndex={-1}>Programmatically focusable only</button>
```

### TabIndex on Non-Interactive Elements
```typescript
// ❌ Bad - div doesn't need tabIndex without interaction
<div tabIndex={0}>Just text</div>

// ✅ Good - only when interactive
<div tabIndex={0} role="button" onClick={handleClick}>
  Click me
</div>
```

## Document Structure

### Lang Attribute
```typescript
// ❌ Bad
<html>

// ✅ Good
<html lang="en">
// or for Chinese content
<html lang="zh-CN">
```

### Heading Accessibility
```typescript
// ❌ Bad
<h1 aria-hidden="true">Title</h1>

// ✅ Good
<h1>Title</h1>
```
