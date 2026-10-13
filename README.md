# COLection website

A small static site: no build step, no server, no dependencies.

```
colection-site/
  index.html           the whole page (text lives here)
  css/style.css        all the styling; colours and fonts are at the top, in :root
  js/count-demo.js     the example count at the top of the page (edit the made-up ballots here)
  images/              screenshots and the logo
  downloads/           put the program's zip in here
```

## Open it in VS Code

1. File > Open Folder, and choose `colection-site`.
2. Install the **Live Server** extension (Ritwick Dey), right-click `index.html` and choose **Open with Live Server**.
3. Edit and save: the browser updates by itself.

(Or just double-click `index.html`. Everything works from a file except nothing here needs a server.)

## Things to do before it goes public

- [ ] Put the program's zip in `downloads/` as `COLection-0.2.0.zip` (or change the link in `index.html`, search for `TODO`).
- [ ] Decide on a licence and say it somewhere (the page deliberately makes no claim about price or licence).
- [ ] Add a way to contact you (for example a "Report a problem" link in the footer).
- [ ] Check you are allowed to name any college or show its logo. The screenshots use a made-up "Example College" with made-up names.
- [ ] Replace the screenshots with your own if you like. They were taken on Linux, so fonts differ slightly from Windows. Keep the file names, or edit the `<img>` tags.
- [ ] Check the claims in "What to know before you use it" still match the program.
- [ ] When you release a new version, change the version number in `index.html` (search `0.2.0`).

## Publish it for free

**GitHub Pages**: make a repository, upload the contents of this folder, then Settings > Pages > deploy from the main branch. You get `https://yourname.github.io/reponame/`. Put the program zip in a GitHub Release and link the Download button to it.
**Netlify or Cloudflare Pages**: drag this folder onto their dashboard.

## Fonts

The page loads Bricolage Grotesque and Public Sans from Google Fonts. If you want it to work with no outside requests at all, download the fonts and host them in a `fonts/` folder, then replace the `<link>` tags in `index.html` with `@font-face` rules.
