# Yegor Yeryomenko Portfolio

Static personal website for Yegor Yeryomenko, deployed with GitHub Pages from the `main` branch of `yegory.github.io`.

The site is built with plain HTML, CSS, and JavaScript. There is no build step or package install required.

## Local Preview

Run a local static server from the repository root:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/
```

Opening `index.html` directly in a browser also works for quick checks, but serving the folder locally better matches GitHub Pages behavior.

## Deployment

GitHub Pages serves user sites from the repository named `<username>.github.io`. This repo should publish from:

```text
main / root
```

After changes are committed and pushed to `main`, GitHub Pages will publish the updated site at:

```text
https://yegory.github.io/
```

The homepage URL should be `/`, not `/index.html`. The site includes a small `404.html` fallback so stale or extensionless paths redirect back to the homepage.

## Structure

- `index.html` - single-page portfolio
- `css/styles.css` - responsive layout and visual styling
- `js/main.js` - navigation, scroll state, modals, carousel behavior, and interactions
- `assets/` - images, videos, documents, and icons
- `.nojekyll` - keeps GitHub Pages from processing the site with Jekyll
