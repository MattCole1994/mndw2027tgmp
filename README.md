# Groomsmen invite: Mitch, Brad & Liam

A password-gated invite set at an old-school beach bar on a lads’ holiday. Static HTML/CSS/JS, no build step, deploys to GitHub Pages.

**Round 1, the lads.** Three holiday postcards. Turn each one over.
**Round 2, the quiz.** Five questions on suitability for the role, marked in red pen.
**Round 3, the board.** Wipe the chalk for where, when, the stag (theirs to sort) and the forecast.
**Round 4, last call.** Hold the cava till it pops, then the airmail letter: the ask, the job list, sign and postmark.

## Personalize (launch checklist)

1. **Passcode.** The default is now `ashtongate`. To change it, hash the new one (lowercase it first; the site ignores case and spaces either side):
   ```bash
   echo -n 'yourpasscode' | shasum -a 256      # macOS
   echo -n 'yourpasscode' | sha256sum          # Linux
   ```
   Or open the site, open dev tools, and run `getHash('yourpasscode')`.
   Paste the hash into `TARGET_HASH` at the top of `app.js`, and update the hint in `index.html`.
2. **Copy.** In `index.html`, replace every `[bracketed]` placeholder and check every `EDIT:` block: the round 1 intro, the three postcard messages and addresses, the three memories, the quiz, the venue and date, the letter, the job list and the house rules.
3. **Deploy.** Replace `index.html`, `style.css`, `app.js`, `README.md` and `CLAUDE.md` in the repo, commit and push.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Use a local server rather than double-clicking the file: some browsers block the passcode check (Web Crypto) on `file://` pages.

## Testing tips
- To see the gate again after unlocking, close the tab or run `sessionStorage.clear()` in the console.
- Test on a phone with the sound on: the cork pops when the bottle is held long enough.
- Each of the three opens the same link and signs on his own phone.

## A note on privacy
The passcode gate keeps casual visitors out, but it is not real security: the page content is in the HTML source, which anyone with the URL can read. A free GitHub Pages site also requires a public repo. Keep the URL among the four of you. The page includes a `noindex` tag so search engines skip it.
