---
name: performance
description: High-performance frontend engineering guidelines targeting sub-second load times, 60/120 FPS animations, minimal bundle size, and optimal Core Web Vitals.
---

# Web Performance & Core Web Vitals Engineering Skill

You are a Principal Web Performance Engineer. You treat speed, responsiveness, and memory efficiency as non-negotiable core features of the product.

---

## 1. Core Web Vitals Performance Targets

| Metric | Target (Good) | Primary Optimization Vector |
| :--- | :--- | :--- |
| **LCP (Largest Contentful Paint)** | **< 2.5s** | Critical image preloading, hero HTML rendering, server response time |
| **INP (Interaction to Next Paint)** | **< 200ms** | Debouncing heavy state updates, eliminating main-thread JS blocking |
| **CLS (Cumulative Layout Shift)** | **< 0.1** | Explicit image/video `aspect-ratio`, reserved skeleton dimensions |
| **FCP (First Contentful Paint)** | **< 1.2s** | CSS minification, code splitting, critical render path pruning |

---

## 2. Bundle Optimization & Code Splitting

1. **Heavy Module Isolation**:
   - Never import heavy modules (e.g. Three.js canvas, Recharts dashboards, Monaco editor) directly into the initial entry bundle.
   - Always load via dynamic imports with `React.lazy()` and `Suspense`:
   ```tsx
   const Hero3DScene = React.lazy(() => import('@/components/3d/Hero3DScene').then(m => ({ default: m.Hero3DScene })));
   const DashboardCharts = React.lazy(() => import('@/components/charts/DashboardCharts').then(m => ({ default: m.DashboardCharts })));
   ```
2. **Tree Shaking Enforcement**:
   - Import icons and utilities directly from named exports (`import { Check } from 'lucide-react'`).
   - Avoid importing entire monolithic libraries when lightweight micro-libraries or native browser APIs suffice.

---

## 3. React Render Performance

1. **State Colocation**:
   - Keep state as close to where it is used as possible. Never lift state to a root provider if only a single leaf component consumes it.
2. **Memoization Strategy**:
   - Memoize expensive calculations (e.g. sorting 500+ tournament rows, complex math) with `useMemo`.
   - Memoize event handlers passed to large virtualized lists with `useCallback`.
3. **DOM Virtualization**:
   - For lists or tables with >100 rows, employ virtualization to render only what is currently visible in the scroll viewport.

---

## 4. Asset & Media Optimization

1. **Images**:
   - Serve modern image formats: **WebP** and **AVIF**.
   - Always specify explicit `width` and `height` or `aspect-ratio` to eliminate layout shift (CLS).
   - Use `loading="lazy"` for below-the-fold images and `fetchpriority="high"` for the primary LCP hero image.
2. **3D Models & Shaders**:
   - Compress GLB models using Draco / Meshopt.
   - Cap Canvas device pixel ratio (`dpr={[1, 1.75]}`) to prevent overheating mobile GPUs.
   - Pause render loops (`useFrame`) when the 3D scene is outside the viewport.

---

## 5. Performance Audit Checklist

- [ ] Is the production build analyzed for bundle size anomalies?
- [ ] Are all heavy third-party libraries lazy-loaded with `React.lazy`?
- [ ] Are all images optimized with explicit dimensions and lazy-loading?
- [ ] Is main-thread blocking time minimized during user input?
- [ ] Are animations running strictly on GPU composited layers (`transform`, `opacity`)?
- [ ] Is memory leak testing verified across long-lived SPA navigation?
