# PROJECT RULES — Mistress Tantra Template

**ALL AGENTS WORKING ON THIS PROJECT MUST READ AND FOLLOW THESE RULES.**

## 1. MEDIA OPTIMIZATION (MANDATORY)

All incoming images and videos must be automatically optimized/compressed for ALL device categories upon upload:

| Device Category | Viewport Width | Video Resolution | Image Max Width |
|----------------|---------------|-----------------|----------------|
| Laptop/Desktop | ≥1024px | 1280×720 (720p) | 1920px |
| Tablet Landscape | 768–1023px | 960×540 | 1200px |
| Tablet Portrait | 480–767px | 640×360 | 900px |
| Mobile | ≤480px | 480×270 | 600px |

### Image Rules
- All images must be converted to WebP format (JPEG fallback only if WebP quality is unacceptable)
- Strip ALL metadata (EXIF, IPTC, XMP) from every image
- Use `<picture>` element with `<source srcset>` and `media` attributes to serve the right size to the right device
- Loss of visual quality is **NON-NEGOTIABLE** — integrity of all images/graphics must remain the same
- If an optimized version does not look good, the user will provide a device-specific replacement

### Video Rules
- Primary format: WebM (VP9) for smallest file size
- Fallback format: MP4 (H.264) for Safari/older browsers
- All videos: autoplay, muted, loop, playsinline
- Strip audio tracks from background/hero videos
- Use `<source>` with `media` attributes or JS-based device detection to serve appropriate resolution
- If a recoded video does not suit a device, the user will provide a customized version

### Responsive Media Implementation Patterns

#### Responsive Images — `<picture>` Element Pattern
All content images use `<picture>` elements with 4 `<source>` tiers (mobile-first ordering). The browser selects the first matching `media` query:

```html
<picture>
  <source media="(max-width: 480px)" srcset="assets/images/mobile/IMAGE.webp" type="image/webp">
  <source media="(max-width: 767px)" srcset="assets/images/tablet-p/IMAGE.webp" type="image/webp">
  <source media="(max-width: 1023px)" srcset="assets/images/tablet-l/IMAGE.webp" type="image/webp">
  <source srcset="assets/images/laptop/IMAGE.webp" type="image/webp">
  <img src="assets/images/IMAGE.png" alt="Description" class="existing-css-class">
</picture>
```

- The `<img>` fallback uses the original unoptimized image (for browsers without `<picture>` support)
- Existing CSS classes are moved from the old `<img>` to the `<img>` inside `<picture>`
- Small/decorative images (logos, favicons, mandalas, icons) are excluded from `<picture>` conversion — they stay as regular `<img>` tags
- CSS for `<picture>` elements: `picture { display: block; width: 100%; height: 100%; }` and `picture img { width: 100%; height: auto; }`

#### Responsive Videos — `data-src` + `{dir}` Placeholder Pattern
Videos use a `data-src` attribute with a `{dir}` placeholder instead of `src`. This prevents the browser from fetching any video before JavaScript determines the correct device directory:

```html
<video data-responsive autoplay muted loop playsinline preload="auto">
  <source data-src="assets/videos/{dir}/VIDEO.webm" type="video/webm">
  <source data-src="assets/videos/{dir}/VIDEO.mp4" type="video/mp4">
</video>
```

- `data-responsive` attribute marks videos for responsive source selection
- `responsive-video.js` (loaded in `<head>` before any `<video>` elements) sets `window.__videoDir` based on viewport width, then on DOMContentLoaded replaces `{dir}` in `data-src` → moves to `src` → calls `video.load()`
- Breakpoint logic in JS matches `<picture>` media queries: ≤480→mobile, ≤767→tablet-p, ≤1023→tablet-l, else→laptop
- Videos do NOT reload on resize (to avoid breaking crossfade animations) — page reload required for viewport changes
- The dual-video crossfade on the Connect page (sacred-path-bg-a / sacred-path-bg-b) uses `data-responsive` and works correctly with this pattern

### Responsive CSS Rules
- Below 1024px (Tablet): ALL multi-column layouts must stack vertically
- Below 480px (Mobile): stacking + minimum 24px side-padding on all containers
- Never use fixed pixel widths for main containers — use max-width with percentage/rem padding
- All inline fixed-height images must use responsive CSS classes instead
- **CSS Cascade Order**: Media queries MUST come AFTER the base rules they override. If a `@media (max-width: 1024px)` rule is defined before the base rule in the stylesheet, the base rule will win due to cascade order. Always place responsive overrides after the base definitions.
- Footer stacks to 2 columns at 1024px, then 1 column at 768px (media queries placed after the `.footer-top` base rule)

## 2. SITE ARCHITECTURE
- Static HTML/CSS/JS site deployed via GitHub Pages from `main` branch
- Repository: `globaldesigns/Mistress-Tantra-Template`
- CSS selector bug note: `#about .about-overlap-image` NEVER matches — the div is a sibling of `#about`, not a descendant. Use `#aboutOverlapImage` directly.
- Always use cache-bust query params on CSS files (`?v=N`) when deploying changes
- Do NOT use query params on video/image source URLs (GitHub Pages rejects them)

## 3. DEPLOYMENT
- GitHub username: `globaldesigns`
- Deploy by committing to `main` and pushing
- Always verify changes on live site after deployment
- Wait at least 45 seconds for GitHub Pages CDN propagation before verifying
- Use Puppeteer-based viewport tests (`test_mobile_viewport.js`) for automated responsive verification across all breakpoints
- Verify: `__videoDir` matches viewport, `<picture>` elements serve correct image sizes, videos load from correct directory, grids stack at 1024px, 24px padding on mobile containers

## 4. OPTIMIZED MEDIA DIRECTORY STRUCTURE

```
assets/
  images/
    laptop/       — 18 WebP files (≥1024px viewport)
    tablet-l/     — 18 WebP files (768–1023px viewport)
    tablet-p/     — 18 WebP files (480–767px viewport)
    mobile/       — 18 WebP files (≤480px viewport)
  videos/
    laptop/       — 5 videos × 2 formats (webm + mp4)
    tablet-l/     — 5 videos × 2 formats
    tablet-p/     — 5 videos × 2 formats
    mobile/       — 5 videos × 2 formats
```

### Image Names (18 unique content images)
hero-about, offerings-square, hero-connect, hero-blog, hero-home, hero-offerings, offerings-hero, rainforest-hero, lotus-pond-hero, candles-hero-bg, sacred-path-steps, blog-hero, blog-featured, blog-card-1, blog-card-2, blog-card-3, blog-card-4, about-overlap

### Video Names (5 unique videos)
hero-bg, rainforest-hero, lotus-pond-hero, candles-hero, sacred-path-bg
