# CLAUDE.md

Single-page groomsmen invite, football edition: Bristol to Xàtiva. Hosted on GitHub Pages.

## Rules
- No bundlers, no npm build. Pure HTML (`index.html`), modern CSS (`style.css`), vanilla JS (`app.js`).
- Mobile-first, responsive. Test at 375px wide, portrait and landscape.
- All paths are relative (`./style.css`, `./app.js`) so the site works under a repo subpath.
- External libraries load from pinned CDN URLs only (canvas-confetti, Google Fonts).
- No photographs. All imagery is inline SVG (the dusk scene, stickers, oranges, goal, club badge).
- The passcode is never stored in plain text. `TARGET_HASH` in `app.js` is SHA-256 of the lowercased, trimmed passcode.
- Auth state lives in `sessionStorage` (key `inner-circle-unlocked`).
- The page is the pitch: mown-grass stripes and chalk lines, read from one end to the other like a match. Chapters are minutes (12′, 45′, 67′, 90′), shown as outlined numerals and as balls in the score bug. No banner strips between sections.
- Look: grass (#174d31, #1a5536), chalk (#f4f1e8), Bristol Blue (#1d3a9e), Valencian orange (#f28c28), stone-coloured contract (#f6f0e1) with blue-black ink (#14245e). Barlow Condensed for display, Libre Caslon Text for body, Homemade Apple only for a typed signature.
- Shared drawings live as `<symbol>`s in the sprite at the top of `index.html` (ball, crest, balloon, player). Anything inside a symbol is styled through CSS custom properties (`--b1`, `--b2`) or `currentColor`, not selectors.
- Interactions: parallax hero with floodlights coming on, sticker packs (find three shinies, fill the album), half-time orange slices, vidiprinter fixtures, press-and-hold penalty, sign (draw or type) the contract. Every interaction has a keyboard path. Respect `prefers-reduced-motion`.
- The copy in `index.html` is Matt’s own words. Don’t rewrite it.
- Club badge is our own design (bridge, ball-sun, M&D). Never reproduce a real club crest, league logo or sticker-album branding.

## Editable content
Search `index.html` for `EDIT:` comments and `[bracketed]` placeholders.
