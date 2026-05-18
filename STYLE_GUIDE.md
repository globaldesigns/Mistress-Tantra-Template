# MISTRESS TANTRA — Official Style Guide
## Permanent Reference for All Sessions

---

## FONTS

| Element         | Font Family          | Size                              | Weight  |
|-----------------|----------------------|-----------------------------------|---------|
| **Hero Title**  | **Allonges Regular** | clamp(3.5rem → 7.5rem)            | 400     |
| H1              | Cormorant Garamond   | clamp(2.8rem → 5rem) / 44.8–80px | 300     |
| H2              | Cormorant Garamond   | clamp(2rem → 3.5rem) / 32–56px   | 400     |
| H3              | Cormorant Garamond   | clamp(1.5rem → 2rem) / 24–32px   | 400     |
| H4              | Cormorant Garamond   | clamp(1.2rem → 1.5rem) / 19–24px | 500     |
| Body / P        | Montserrat           | 1rem / 16px                       | 300     |
| Subtitle/Eyebrow| Montserrat           | 0.85rem / ~13.6px                 | 300     |
| Buttons         | Montserrat           | 0.75rem / 12px                    | 500     |
| Nav Links       | Montserrat           | 0.7rem / ~11.2px                  | 400     |
| Tagline (italic)| Cormorant Garamond   | clamp(1.1rem → 1.5rem)            | italic  |
| Blockquote      | Cormorant Garamond   | clamp(1.3rem → 1.8rem)            | italic  |

### 3 Fonts Used (Playfair Display removed)
- **Allonges Regular** — Hero title only (self-hosted TTF: `assets/fonts/Allonges.ttf`)
- **Cormorant Garamond** — Display/headings (weights: 300, 400, 500, 600, 700)
- **Montserrat** — Body/UI (weights: 200, 300, 400, 500, 600)

---

## COLOR PALETTE

| Variable           | Hex       | Usage                        |
|--------------------|-----------|------------------------------|
| --deep-forest      | #0f1f0f   | Dark backgrounds             |
| --sage             | #5a7a5a   | Mid-tone green               |
| --misty-sage       | #8fa88f   | Light green text on dark bg  |
| --olive-grove      | #4a5c3a   | Accent green                 |
| --warm-earth       | #3d3428   | Body text                    |
| --raw-umber        | #6b5d4f   | Secondary text               |
| --warm-sand        | #c4a882   | Sand accent                  |
| --charcoal         | #2c2c2c   | Dark text                    |
| --stone            | #8a8278   | Muted text                   |
| --linen            | #f5f0e8   | Page background              |
| --ivory-mist       | #faf7f2   | Section background           |
| --aman-gold        | #c9a96e   | Primary accent/gold          |
| --aman-gold-light  | #d4b87e   | Hover gold                   |

---

## FIXED DESIGN ELEMENTS — DO NOT CHANGE

The following elements are locked and must remain unchanged across all sessions:

1. **Mandala PNG divider** (`mandala-divider.png`) — white, transparent background, 16–18px inline between BOSTON and SAN FRANCISCO in the hero lower-left text
2. **Social icons** — 3 icons (Instagram, Flickr, Email), far left of header bar, white SVG, 24×24px white outline square border, transparent fill
3. **Logo** (`logo-hero.png`) — transparent background, top center, 90px height desktop
4. **Header bar** — positioned directly below logo, gold-tinted glassmorphism strip, social icons left / MENU right
5. **Hero text layout** — lower left: H1 "Mistress Tantra" (Cormorant Garamond italic), then "TANTRICA GODDESS" (bold caps), then "BOSTON ◈ SAN FRANCISCO" (with mandala divider)

---

## GOOGLE FONTS IMPORT

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=Montserrat:wght@200;300;400;500;600&family=Playfair Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');
```

---

## CSS VARIABLES (from styles.css)

```css
--font-display: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
--font-body:    'Montserrat', 'Helvetica Neue', Arial, sans-serif;
--font-accent:  'Playfair Display', 'Cormorant Garamond', Georgia, serif;
```

---

*This file is the permanent style reference for the Mistress Tantra template.*
*It must be consulted at the start of every session before making any changes.*
