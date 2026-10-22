# CLAUDE.md

Single-page groomsmen invite for Mitch, Brad and Liam: an old-school beach club on a lads’ holiday. Hosted on GitHub Pages.

## Rules
- No bundlers, no npm build. Pure HTML (`index.html`), modern CSS (`style.css`), vanilla JS (`app.js`).
- Mobile-first, responsive. Test at 375px wide, portrait and landscape.
- All paths are relative (`./style.css`, `./app.js`) so the site works under a repo subpath.
- External libraries load from pinned CDN URLs only (canvas-confetti, Google Fonts).
- No photographs. All imagery is inline SVG (beach bar at sunset, festoon lights, robin, postcards, stamp, cava bottle, postmark).
- The passcode is never stored in plain text. `TARGET_HASH` in `app.js` is SHA-256 of the lowercased, trimmed passcode.
- Auth state lives in `sessionStorage` (key `lads-only-unlocked`).
- Tone: Matt’s voice. Blokey, dry, no gushing. Satire over sentiment.
- Look: retro 70s beach club. Sand (#f4e3c3), cream (#fbf1dc), orange (#e8622c), marigold (#f2a03d), mustard (#e9b949), sea teal (#1f6b70, #134a50), brown ink (#3a2418, #5b3424). Shrikhand for display, Jost for body, Yellowtail for script and signatures. The mustard/orange/brown triple stripe is the signature device.
- Rounds: 1 The lads (postcards), 2 The quiz (satire, red pen), 3 The board (wipe the chalk), 4 Last call (hold to pop the cava, then the airmail letter, sign, postmark). A pint per round in the top bar. No banner strips.
- Shared drawings live as `<symbol>`s in the sprite at the top of `index.html` (robin, stamp, postmark, pint).
- Every interaction has a keyboard path. Respect `prefers-reduced-motion`.
- Facts: Matt is from Whitchurch, Bristol. City fan (Ashton Gate, the Robins pub). Wedding in Xàtiva, Spain, 2027. At the front it’s Dasha and Matt; don’t name the officiant. The stag is the groomsmen’s job, nothing about it is decided. Don’t mention suits.
- Never reproduce a real club crest or brand logo.

## Editable content
Search `index.html` for `EDIT:` comments and `[bracketed]` placeholders.
