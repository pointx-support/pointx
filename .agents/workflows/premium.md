---
name: premium
description: Master 23-step end-to-end development workflow for creating production-ready, interactive, visually stunning, accessible, and high-performance web applications.
---

# Master Premium Web Development Workflow

This workflow orchestrates the cross-functional AI engineering team (UI/UX Designer, Senior Frontend Engineer, 3D Graphics Engineer, Motion Designer, Accessibility Engineer, Performance Engineer, and QA Specialist) to deliver an elite web experience.

---

## The 23-Step Master Execution Process

```mermaid
flowchart TD
    A[1-3: Requirements & Discovery] --> B[4-8: Architecture & Design Strategy]
    B --> C[9-12: Implementation (UI, Responsive, Motion, 3D)]
    C --> D[13-19: Multi-Vector Verification & QA]
    D --> E[20-22: Remediation & Polish]
    E --> F[23: Verified Completion Report]
```

### Phase 1: Requirements Analysis & User Discovery
1. **Analyze Requirements**: Parse the user's explicit goals, constraints, domain requirements, and business objectives.
2. **Analyze Codebase**: Inspect existing directory structures, dependencies, design tokens, configuration files, and state architectures to reuse established foundations.
3. **Analyze Target Users**: Identify the primary persona, user ergonomics, cognitive load considerations, device distribution (mobile vs desktop), and contextual environments.

### Phase 2: System Architecture & Visual Strategy
4. **Create UX Architecture**: Map user journeys, state flows, error handling boundaries, empty states, and interaction models.
5. **Create Visual Architecture**: Establish typography hierarchy, color palette ratios (60-30-10), surface elevation layers, and design token consistency.
6. **Create Component Architecture**: Design modular component hierarchies, TypeScript interface contracts, and clean prop signatures.
7. **Select Appropriate Animations**: Define animation choreography, duration budgets (150ms–350ms), spring parameters, and reduced-motion fallback rules.
8. **Decide 3D Value Proposition**: Evaluate if 3D adds genuine narrative or analytical value. If yes, specify model formats, lighting, and GPU performance constraints.

### Phase 3: High-Fidelity Implementation
9. **Implement the UI**: Code clean, semantic, accessible JSX components using the design system primitives (shadcn, Tailwind).
10. **Implement Responsive Behavior**: Build mobile-first layouts across all breakpoints (xs, sm, md, lg, xl, 2xl) with zero horizontal overflow.
11. **Implement Animations**: Integrate Motion, GSAP, and Lenis utilities for fluid state transitions, staggered entrances, and micro-interactions.
12. **Implement 3D (If Applicable)**: Build lazy-loaded R3F scenes with DPR clamping, WebGL error boundaries, and mobile fallbacks.

### Phase 4: Rigorous Multi-Vector Verification & QA
13. **Test in Browser Environment**: Verify interactive state changes, form submissions, and modal/drawer behavior.
14. **Test Mobile Layout (320px–430px)**: Validate touch ergonomics, thumb zones, sticky elements, and viewport heights (`100dvh`).
15. **Test Desktop Layout (1440px+)**: Validate widescreen scaling, typography readability, and container bounds.
16. **Check Console Errors**: Ensure 0 runtime exceptions, 0 unhandled promise rejections, and 0 React key/hydration warnings.
17. **Check Broken Assets**: Verify all image URLs, SVG icons, fonts, 3D model paths, and API endpoints load successfully.
18. **Check Accessibility (a11y)**: Audit keyboard-only tab navigation, focus rings, ARIA roles, and WCAG contrast.
19. **Check Performance & Core Web Vitals**: Verify bundle splitting, LCP (<2.5s), CLS (<0.1), and 60 FPS animation smoothness.

### Phase 5: Remediation, Polish & Final Report
20. **Fix Discovered Problems**: Automatically resolve any layout clipping, type errors, lint warnings, or broken interactions.
21. **Re-Test**: Re-run the full build (`npm run build`) and lint suites to verify all fixes.
22. **Refine Visual Design**: Apply final micro-adjustments to whitespace, letter spacing, borders, and tactile hover feedback.
23. **Report Completion**: Present a clear, structured summary of everything built, verified, and ready for production.
