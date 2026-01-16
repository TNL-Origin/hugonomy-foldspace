# Icon Assets

This directory should contain the extension icons in the following sizes:

- `icon16.png` — 16×16px (browser toolbar)
- `icon32.png` — 32×32px (browser toolbar retina)
- `icon48.png` — 48×48px (extension management page)
- `icon128.png` — 128×128px (Chrome Web Store listing)

## Design Guidelines

**Color Scheme:**
- Primary: #66b3ff (blue)
- Background: #1e1e2e to #3a3a8a (gradient)

**Style:**
- Abstract geometric design
- FoldSpace glyph or spiral motif
- Clean, modern look

## Placeholder Icons

For development/testing, you can use placeholder icons from:
- [Placeholder.com](https://placeholder.com/)
- Or create simple colored squares in an image editor

**Quick placeholder creation:**
```bash
# Using ImageMagick (if installed)
convert -size 16x16 xc:#66b3ff icon16.png
convert -size 32x32 xc:#66b3ff icon32.png
convert -size 48x48 xc:#66b3ff icon48.png
convert -size 128x128 xc:#66b3ff icon128.png
```

**Note:** Before beta distribution or Chrome Web Store submission, replace with proper icon assets designed according to [Chrome extension icon guidelines](https://developer.chrome.com/docs/webstore/images/).
