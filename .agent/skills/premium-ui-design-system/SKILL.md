---
name: Premium UI Design System (Tailwind 4 & CSS)
description: Design principles, styling tokens, glassmorphic UI, animations, and typography rules for creating beautiful, premium web interfaces.
---

# Premium UI Design System

Use this skill when building new frontend pages, components, dashboards, or visual modules to ensure a visually stunning and responsive user experience.

## 1. Aesthetic Foundations & Tokens

### A. Color Palettes
Avoid plain primary colors (pure red, blue, green). Instead, use rich, modern HSL/utility custom shades:
- **Slate/Zinc Neutral**: Dark modes should use deep ink-like grays (e.g. Slate 950 `rgb(9, 13, 22)`) instead of flat blacks.
- **Vibrant Accents**: Use refined accents like Indigo/Violet, Teal/Emerald, and Rose/Coral for labels, indicators, and actions.
- **Gradients**: Use subtle, dual-tone direction gradients:
  `bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600`

### B. Glassmorphism Formula (CSS)
For premium card overlays, modal dialogs, and sidebars, implement glassmorphic effects:
```tsx
<div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
    {children}
</div>
```

---

## 2. Micro-Animations & Dynamic Hover States

An interface that feels responsive encourages engagement. Implement hover effects on all interactive elements.

- **Transitions**: Always include transitions for class modifications:
  `transition-all duration-300 ease-out`
- **Dynamic Scale**: Lift cards slightly on hover:
  `hover:-translate-y-1 hover:shadow-lg hover:border-slate-300`
- **Button Shimmer/Glow**: Use soft rings or border pulses for primary call-to-actions:
  `hover:ring-4 hover:ring-indigo-100 dark:hover:ring-indigo-950`

---

## 3. Strict Rules Against Placeholders

A premium interface must never contain lazy placeholders. Follow these rules strictly:
1. **No `lorem ipsum`**: Always use realistic, domain-specific text (e.g. realistic TikTok hashtags, comments, or scoring reason statements).
2. **No Gray Placeholder Boxes**: Use actual SVG icons from `lucide-react` or generate realistic image assets.
3. **No Unfinished UI Labels**: Never leave labels like `[Insert Name Here]` or `TBD`. Scaffold real, mockable user profiles with realistic stats if database values are missing.
4. **Rich Mock Data**: If displaying a demo account, ensure the follower counts, names, biography descriptions, and charts represent actual profiles (e.g. a music creator, viral chef, or fitness account).

---

## 4. Typography Rules

- **Font Sizing**: Use a distinct typographic scale:
  - Titles: `tracking-tight font-extrabold text-slate-900`
  - Subtitles: `text-slate-500 font-medium`
  - Body: `leading-relaxed text-slate-600`
- **Typography hierarchy**: Maintain proper paragraph flow and list spacing so text is easily scannable.
