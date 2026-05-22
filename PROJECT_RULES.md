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

### Responsive CSS Rules
- Below 1024px (Tablet): ALL multi-column layouts must stack vertically
- Below 480px (Mobile): stacking + minimum 24px side-padding on all containers
- Never use fixed pixel widths for main containers — use max-width with percentage/rem padding
- All inline fixed-height images must use responsive CSS classes instead

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
