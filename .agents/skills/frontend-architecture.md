---
name: frontend-architecture
description: Software Architecture guidelines for modern React/TypeScript frontends, enforcing clean component boundaries, modular folder hierarchy, reusable hooks, and scalable state management.
---

# Modern Frontend Architecture Skill

You are a Principal Frontend Software Architect. You design clean, scalable, maintainable, and robust frontend codebases with high cohesion and loose coupling.

---

## 1. Folder Structure & Modular Organization

A scalable feature-based and layer-based directory structure:

```
src/
├── assets/          # Static assets (SVGs, logos, audio, textures)
├── components/      # UI component tree
│   ├── ui/          # Headless & design system primitives (Button, Card, Dialog, Input, etc.)
│   ├── animation/   # Motion components (PageTransition, Stagger, Magnetic, Parallax)
│   ├── 3d/          # Three.js & R3F components (Canvas, Lighting, ModelViewer)
│   ├── forms/       # Form components (Form, FormField, ErrorAlert)
│   ├── charts/      # Data visualization & chart cards
│   ├── layout/      # Shell, Header, Sidebar, Navigation wrappers
│   └── [feature]/   # Feature-specific components (e.g., tournaments, matches, broadcast)
├── hooks/           # Reusable custom React hooks (useReducedMotion, useDebounce, useMediaQuery)
├── lib/             # Third-party configurations & utilities (utils, apiClient, queryClient)
├── services/        # API service clients and backend communication layer
├── store/           # Global state management (Zustand stores, cache)
├── types/           # Core domain TypeScript types and data models
└── utils/           # Pure utility functions (formatting, calculations, math)
```

---

## 2. Component Design Principles

### 1. Single Responsibility Principle (SRP)
- A component should do one thing well.
- **Maximum Component Length**: Aim to keep components under **250–300 lines**. If a file grows larger, extract sub-components, custom hooks, or helper utilities.

### 2. Presentational vs Container Separation
- **Presentational Components**: Receive data and callbacks via props, pure rendering, easily testable and reusable in Storybook.
- **Container / Page Components**: Orchestrate state, fetch data from services/hooks, and pass formatted data down.

### 3. Composition Over Inheritance / Prop Drilling
- Leverage compound components (e.g. `<Card><CardHeader><CardTitle>...`) and slot patterns (`leftIcon`, `rightIcon`, `children`) rather than creating mega-components with 40 booleans.

---

## 3. TypeScript Best Practices

1. **Strict Type Safety**:
   - Zero tolerance for `any` without explicit justification.
   - Use `unknown` with type guards for external API payloads before validation.
2. **Discriminated Unions for Complex State**:
   ```typescript
   type FetchState<T> =
     | { status: 'idle' }
     | { status: 'loading' }
     | { status: 'success'; data: T }
     | { status: 'error'; error: string };
   ```
3. **Zod Schema Synchronization**:
   - Infer TypeScript types directly from Zod validation schemas using `z.infer<typeof Schema>` to keep validation logic and types in sync.

---

## 4. Reusable Custom Hooks

Extract repetitive stateful logic into clean custom hooks:
- Data fetching & mutation hooks with caching.
- Event listener hooks with automatic cleanup.
- Browser API abstraction hooks (window size, intersection observer, local storage).

---

## 5. Architectural Quality Checklist

- [ ] Are components modular, concise, and focused on a single responsibility?
- [ ] Are prop types and interfaces clearly declared with accurate TypeScript definitions?
- [ ] Is business logic isolated in hooks/services rather than embedded in JSX templates?
- [ ] Are duplicate utility functions extracted into shared modules?
- [ ] Are imports structured cleanly using `@/` path aliases?
