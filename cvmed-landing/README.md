# cvmed landing page — Next.js (App Router)

## Files

```
app/
  layout.tsx        fonts (Inter + Instrument Serif via next/font), no-flash theme script
  page.tsx          the landing page
  globals.css       design tokens for light and dark, all component styles
components/
  Nav.tsx           header with theme toggle
  ThemeToggle.tsx   client component, persists choice to localStorage
  ProductMockup.tsx the complaints-list screenshot in the hero
```

## Setup

Works with a fresh `npx create-next-app@latest` (TypeScript, App Router). Copy the files in, keep or remove Tailwind — this page doesn't use it and won't conflict.

If your project doesn't have the `@/` path alias, either add it to `tsconfig.json`:

```json
{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }
```

or change the two imports in `app/page.tsx` to relative paths.

## Theme

- Default follows the OS (`prefers-color-scheme`).
- The toggle sets `data-theme="light" | "dark"` on `<html>` and stores it in `localStorage`.
- The inline script in `layout.tsx` applies the stored theme before first paint, so there's no flash.
- All colours are CSS custom properties in `globals.css`. To retheme, edit the two token blocks at the top; nothing else references a raw hex.

## Placeholders to replace

- Pricing figure and inclusions in the pricing section
- The five clock figures — verify against the current text of MDR Article 87 and 21 CFR 803 before publishing
- MHRA line — fill in once you've confirmed current MORE timescales
- All `href` targets (`/demo`, `/pilot`, `/login`, footer links)
- Mockup names and records are fictional
