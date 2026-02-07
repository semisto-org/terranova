# Typography Configuration

## Google Fonts Import

Add to your HTML `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Note:** Sole Serif Small is a commercial font by CAST Type Foundry. You'll need to purchase a license and self-host it. As a fallback, consider using `DM Serif Display` or `Playfair Display` from Google Fonts.

## Font Usage

- **Headings:** Sole Serif Small — Used for page titles, section headings, and marketing headlines
- **Body text:** Inter — Used for all body text, UI labels, descriptions, and form fields
- **Code/technical:** JetBrains Mono — Used for code snippets, IDs, and technical identifiers

## CSS Configuration

```css
:root {
  --font-heading: 'Sole Serif Small', 'DM Serif Display', serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

body {
  font-family: var(--font-body);
}

code, pre, .font-mono {
  font-family: var(--font-mono);
}
```
