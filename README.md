# The Inner Circle: groomsmen invite, Bristol to Xàtiva

A password-gated, single-page invite for three groomsmen, played like a match. Static HTML/CSS/JS, no build step, deploys to GitHub Pages.

**12′ Bristol.** Six sticker packs, three shinies. Open them to fill the album with the lads.
**45′ Half-time.** Oranges on the centre spot. Each slice reveals a line about Dasha.
**67′ Xàtiva.** The fixtures come through on the vidiprinter: stag, wedding, kit, your position.
**90′ The signing.** Press and hold the ball to score, then sign the contract.

## Personalize (launch checklist)

1. **Passcode.** The default is still `dayone`. To change it, generate the hash of your new one (lowercase it first; the site ignores case and surrounding spaces):
   ```bash
   echo -n 'yourpasscode' | shasum -a 256      # macOS
   echo -n 'yourpasscode' | sha256sum          # Linux
   ```
   Or open the site, open dev tools, and run `getHash('yourpasscode')`.
   Paste the hash into `TARGET_HASH` at the top of `app.js`, and update the hint text in `index.html`.
2. **Story copy.** In `index.html`, replace every `[bracketed]` placeholder and edit the blocks marked `EDIT:`.
   - **Your brother’s name** appears three times: the sticker’s `data-name`, the album slot’s `data-for` (these two must match exactly), and the album heading.
   - **Shirt numbers** are the `data-number` on each sticker (8, 9 and 5 to start).
   - The three memories, the four Dasha lines, the stag and wedding details, the dress code, the contract rows and the terms & conditions.
3. **Photos.** Not needed any more. Everything is drawn, so the `assets/` folder can go.
4. **Deploy.** See below, then test the link on your phone.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Use a local server rather than double-clicking the file: some browsers block the passcode check (Web Crypto) on `file://` pages.

## Deploy to GitHub Pages

If the old version is already live, replace `index.html`, `style.css`, `app.js`, `README.md` and `CLAUDE.md` in the repo, commit and push. Same URL, new site.

From scratch:
```bash
cd groomsmen-invite
git init
git add .
git commit -m "Groomsmen invite"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/groomsmen-invite.git
git push -u origin main
```

Then in the repo on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.**
After a minute the site is live at `https://YOUR-USERNAME.github.io/groomsmen-invite/`.

## Testing tips
- To see the gate again after unlocking, close the tab (sessionStorage clears) or run `sessionStorage.clear()` in the console.
- Test on a phone: the sticker flip, the penalty hold, the signature pad and the confetti are the moments that matter.
- Each of the three lads opens the same link and signs on his own phone.
- The packs shuffle on every visit, so nobody can tell the others where the shinies are.

## A note on privacy
The passcode gate keeps casual visitors out and keeps the passcode itself secret, but it is not real security: the page content is in the HTML source, which anyone with the URL can read. A free GitHub Pages site also requires a public repo. Don't put anything on the page you wouldn't want a stranger to stumble on, and keep the URL among the four of you. The page includes a `noindex` tag so search engines skip it.
