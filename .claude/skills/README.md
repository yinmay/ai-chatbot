# Claude Code Skills

This directory contains skill files for Claude Code based on project rules and patterns.

## Skills Overview

| Skill | Description |
|-------|-------------|
| [typescript-patterns](typescript-patterns.md) | TypeScript best practices: no enums, no any, import type, as const |
| [react-patterns](react-patterns.md) | React/JSX rules: hooks, keys, components, Next.js specifics |
| [accessibility](accessibility.md) | a11y rules: ARIA, semantic HTML, keyboard navigation |
| [code-quality](code-quality.md) | Code style: const/let, arrow functions, modern JS |
| [ai-agent-patterns](ai-agent-patterns.md) | AI agent architecture: routing, tools, streaming |
| [database-patterns](database-patterns.md) | Drizzle ORM: schema, queries, migrations |
| [testing-patterns](testing-patterns.md) | Playwright e2e testing rules and patterns |
| [security-patterns](security-patterns.md) | Security: no secrets, XSS prevention, validation |

## Quick Reference

### Most Important Rules

**TypeScript:**
- No `enum` - use `as const` objects
- No `any` type
- Use `import type` for types

**React:**
- No array index as key
- Hook dependencies must be complete
- Use `<>` not `<Fragment>`

**Code:**
- `const`/`let` never `var`
- `for...of` over `.forEach()`
- Arrow functions over function expressions

**Next.js:**
- Use `next/image` not `<img>`
- No `next/head` in App Router

### Commands

```bash
pnpm lint    # Check for issues
pnpm format  # Auto-fix issues
```

## Source

These skills are derived from:
- `.cursor/rules/ultracite.mdc` - Ultracite/Biome linting rules
- Project architecture patterns in `lib/ai/agent/`
- Database patterns in `lib/db/`
