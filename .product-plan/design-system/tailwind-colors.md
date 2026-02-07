# Tailwind Color Configuration

## Color Choices

- **Primary:** Custom `#5B5781` (deep purple) — Used for Lab branding, primary buttons, links, key accents
- **Secondary:** Custom `#AFBD00` (lime green) — Used for Design Studio, tags, highlights, secondary elements
- **Neutral:** `stone` (Tailwind built-in) — Used for backgrounds, text, borders

## Pole-Specific Colors

Each functional pole has its own accent color:

| Pole | Color | Background | Usage |
|------|-------|-----------|-------|
| Lab Management | `#5B5781` | `#c8bfd2` | Lab operations, admin |
| Design Studio | `#AFBD00` | `#e1e6d8` | Project design |
| Academy | `#B01A19` | `#eac7b8` | Training, education |
| Nursery | `#EF9B0D` | `#fbe6c3` | Plant nursery |
| Implementation | `#234766` | `#c9d1d9` | Field work, construction |
| Website | `#5B5781` | `#FFFFFF` | Public site |

## Tailwind v4 Configuration

Since Terranova uses Tailwind CSS v4, configure custom colors via CSS custom properties in your main CSS file:

```css
@theme {
  --color-primary: #5B5781;
  --color-primary-light: #c8bfd2;
  --color-secondary: #AFBD00;
  --color-secondary-light: #e1e6d8;
  --color-pole-lab: #5B5781;
  --color-pole-design: #AFBD00;
  --color-pole-academy: #B01A19;
  --color-pole-nursery: #EF9B0D;
  --color-pole-implementation: #234766;
}
```

## Usage Examples

Primary button: `bg-primary hover:bg-primary/90 text-white`
Secondary badge: `bg-secondary-light text-stone-800`
Neutral text: `text-stone-600 dark:text-stone-400`
Active pole indicator: `border-l-2 border-[var(--color-pole-design)]`
