# Kukis logo

The mark is the header wordmark (`src/components/ui/Logo.tsx`) with the dot of
the "i" turned into a bitten cookie — the direction locked in
`brand-guidelines-final.md` ("cookie-bite negative space … or the dot of the i").

- Type: Gabarito ExtraBold, tracked `-0.04em`, baked to outlines (no webfont needed)
- Ink: Blueberry `#2f6fb0` · Canvas: Milk `#fff6e7` (the page background)
- Clear space: half the mark's height on every side — already built into the files
- The bite is a real hole through the glyph, not a Milk-coloured dot, so the mark
  survives being placed on another background

| File | Use |
|---|---|
| `kukis-logo.svg` | square lockup — app icon, avatar, Shopify listing |
| `kukis-logo-{1024,512,256,180,64,32}.png` | same, rasterised (180 = apple-touch-icon) |
| `kukis-wordmark.svg` | horizontal wordmark — email headers, docs, press |
| `kukis-wordmark-{2400,1200,600}.png` | same, rasterised |

Regenerate after any change to the tokens or the bite geometry:

```bash
python3 scripts/build-logo.py      # SVGs (fetches + caches the font on first run)
node scripts/build-logo-png.mjs    # PNGs, via the puppeteer already in devDeps
```

At 32px the crumbs merge into the dot; below that, use a cropped "K" rather than
the full wordmark.
