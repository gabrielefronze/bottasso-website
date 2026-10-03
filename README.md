# bottasso-website

A static website for Nicolò Bottasso. Copy lives in YAML under `src/content/`.

```bash
npm install
npm run dev
```

## GitHub Pages

Every push to `main` (and any manual **Actions → Deploy to GitHub Pages → Run workflow**) builds the site and deploys it with GitHub Actions.

Live preview: https://gabrielefronze.github.io/bottasso-website/

`astro.config.mjs` uses `base: "/bottasso-website"` so CSS, JS, images and in-site links work on that project URL. When you point `www.nicolobottasso.com` at GitHub Pages, drop `base` and add `public/CNAME` with that host.
