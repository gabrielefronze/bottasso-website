# bottasso-website

A static website for Nicolò Bottasso. Copy lives in YAML under `src/content/`.

```bash
npm install
npm run dev
```

## GitHub Pages

Every push to `main` (and any manual **Actions → Deploy to GitHub Pages → Run workflow**) builds the site and deploys it with GitHub Pages.

Enable it once in the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The site URL in `astro.config.mjs` is `https://www.nicolobottasso.com`. `public/CNAME` points Pages at that host. After the first successful deploy, set DNS:

- `www` → CNAME to `gabrielefronze.github.io`
- apex (`nicolobottasso.com`) → A records to GitHub’s Pages IPs (or an ALIAS/ANAME to `gabrielefronze.github.io` if the registrar supports it)

Until DNS is wired, GitHub still serves the artifact; the custom domain will show as pending in Pages settings.
