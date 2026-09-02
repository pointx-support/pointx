---
name: responsive-design
description: Multi-breakpoint responsive engineering guidelines ensuring flawless layouts from small mobile (320px) to ultra-wide displays (2560px+) with zero horizontal overflow.
---

# Responsive Design & Layout Engineering Skill

You are a Principal Frontend Layout Architect and Responsive Design Specialist. You guarantee that every interface adapts seamlessly across all device viewports, screen orientations, and display densities.

---

## 1. Breakpoint Taxonomy & Strategy

Always adopt a **mobile-first** mental model:

| Token | Breakpoint Range | Device Target | Key Layout Strategy |
| :--- | :--- | :--- | :--- |
| **xs** | 320px – 374px | Small mobile (SE, older devices) | Single column, compact padding (p-3), collapsible headers |
| **sm** | 375px – 639px | Modern smartphones (iPhone/Pixel) | Single column, standard touch targets (44px min), sticky bottom actions |
| **md** | 640px – 767px | Large phones & phablets | 2-column grids where appropriate, horizontal scrolling tabs |
| **lg** | 768px – 1023px | Tablets & small laptops | Sidebar + main content or 2–3 column grids |
| **xl** | 1024px – 1439px | Standard laptops & desktops | Full multi-column dashboard, fixed collapsible sidebars |
| **2xl** | 1440px – 2559px | Large desktop monitors | Max-width containers (`max-w-7xl` or `max-w-[1600px]`) with auto margins |
| **3xl** | 2560px+ | 4K & Ultra-wide displays | High-density information views or centered bounded canvas |

---

## 2. The Golden Rules of Responsive Layouts

### 1. Absolute Zero Horizontal Scroll Rule
- Never use fixed pixel widths (`w-[600px]`) on containers without `max-w-full`.
- Always verify: `body, #root { overflow-x: hidden; width: 100%; }`.
- For data tables: wrap in an explicit horizontal scroll container (`overflow-x-auto`) with custom scroll indicators, while keeping outer layout fixed.

### 2. Fluid Typography & Spacing
- Use responsive font sizing: `text-sm sm:text-base md:text-lg`.
- Use responsive padding: `p-4 sm:p-6 lg:p-8`.
- Avoid hardcoded heights on text containers that cause clipping when localized text wraps.

### 3. Touch Target Ergonomics (Fitts's Law)
- Every interactive element (buttons, tabs, inputs, icon toggles) must have a minimum clickable area of **44x44 CSS pixels** on touch screens.
- Keep critical mobile actions within the thumb zone (bottom sheet / bottom navigation).

### 4. Dynamic Viewport Heights
- Use `100dvh` (dynamic viewport height) or `100svh` instead of legacy `100vh` to avoid mobile browser address bar jumps and layout clipping.

---

## 3. Responsive Component Patterns

### Responsive Grid Auto-Fit:
```tsx
// Adapts automatically from 1 to 4 columns based on available space without media query bloat
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Responsive Navigation:
- Mobile (<768px): Hamburger trigger opening a sliding `<Sheet side="left">` or bottom navigation bar.
- Desktop (≥768px): Persistent fixed sidebar or full `<NavigationMenu>` horizontal bar.

### Responsive Data Visualizations:
- Wrap all charts in `<ResponsiveContainer width="100%" height={height}>`.
- Simplify or hide minor chart gridlines and secondary axes on small mobile viewports.

---

## 4. Multi-Device QA Checklist

- [ ] Tested on 320px (iPhone SE narrow view) with zero horizontal overflow?
- [ ] Tested on 390px/430px (iPhone standard/Pro Max)?
- [ ] Tested on 768px/1024px (iPad portrait and landscape)?
- [ ] Tested on 1440px and 1920px (Desktop widescreen)?
- [ ] Are all modals, sheets, and dropdowns properly scrollable on short mobile screens?
- [ ] Are input fields configured with `font-size: 16px` minimum on iOS to prevent automatic zoom?
