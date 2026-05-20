# Custom Dancewear by Jo-Anne

A simple, static storefront. No backend, no database, no payment processor — orders are paid via Venmo or PayPal and the buyer emails the order details.

## What's in here

```
dancewear-site/
├── index.html      # Page shell
├── styles.css      # All styling
├── app.js          # Cart + router + product rendering
├── data.js         # ← EDIT THIS: business name, prices, payment info, products, fabrics
└── README.md       # This file
```

## Try it locally

Just double-click `index.html`, or for full-fidelity testing:

```bash
cd dancewear-site
python3 -m http.server 8000
# open http://localhost:8000
```

## Editing things you'll want to change

All editable content lives in `data.js`:

- **`CONFIG.businessName`** and **`CONFIG.tagline`** — what shows at the top of the site
- **`CONFIG.pricing`** — `perItem` ($55), `bundle` ($95), `textureUpcharge` ($5)
- **`CONFIG.payment`** — Venmo handle/link, PayPal handle/link, contact email. Replace the `@JoAnne-Example` placeholders with the real values.
- **`PRODUCTS.tops`** and **`PRODUCTS.bottoms`** — name, description, optional image path (`img: "images/top1.jpg"`)
- **`FABRIC_GROUPS`** — three groups (Standard, Ribbed +$5, Foil +$5). Each swatch has a `name` and a `hex`. You can add `img: "swatches/carminio.jpg"` to use a real cropped fabric photo instead of a flat color block.

### Adding real fabric photos later

Crop each swatch from the boards into a square (~200×200). Save them as `swatches/<name>.jpg` next to `index.html`. Then in `data.js`:

```js
{ name: "Carminio", hex: "#d7522c", img: "swatches/carminio.jpg" }
```

The photo will replace the color block. Keeping the `hex` as a fallback is recommended.

### Adding real style photos

Same idea — save them under `images/` and set `img:` on each product in `data.js`.

## Deploying for free

### Option 1 — Netlify (recommended, takes ~2 minutes)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire `dancewear-site` folder onto the page
3. You get a live URL like `wandering-violet-1234.netlify.app`
4. Optional: sign up (free) to claim a custom subdomain or attach a real domain

No account needed to start. To push updates, drag the folder again, or sign up and connect a GitHub repo for auto-deploys.

### Option 2 — GitHub Pages (free, version-controlled)

1. Create a free GitHub account
2. Create a new public repo (e.g., `dancewear`)
3. Upload these files to it
4. Settings → Pages → Source: `main` branch, `/ (root)`
5. Site goes live at `https://<your-username>.github.io/dancewear/`

### Option 3 — Cloudflare Pages

Similar to Netlify, also free. Go to [pages.cloudflare.com](https://pages.cloudflare.com), connect a GitHub repo or upload a zip.

### Option 4 — Self-host on CasaOS (works, but has trade-offs)

You can absolutely host this on your CasaOS laptop. Two caveats:

1. **Security**: exposing a home server to the public internet requires opening ports on your router, which exposes more than just this site. If CasaOS or any container on it has a vulnerability, an attacker could pivot from the public-facing site into your home network. For a static site that doesn't store anything sensitive, the practical risk is low, but it's still wider than zero. Netlify takes that risk to zero because nothing in your house is reachable.
2. **Reliability**: if your power, internet, or laptop goes down, the site goes down. Netlify is on a global CDN.

If you still want to self-host:

- Add the file-browser or a static-site app (e.g., **Nginx** or **Caddy**) to CasaOS, point it at this folder.
- Set up a dynamic-DNS hostname (DuckDNS is free) so you have a stable address as your home IP changes.
- Open ports 80/443 on your router and forward to your CasaOS machine.
- Use Caddy or Cloudflare Tunnel to get free HTTPS (a must — browsers will warn on HTTP).
- **Cloudflare Tunnel is the safest self-host path**: it gives you a public URL pointing at your CasaOS site *without* opening any ports on your router. Highly recommended if you want to use your home server.

## How the cart and pricing work

- Cart lives in the browser's `localStorage` — survives reloads, but each visitor has their own cart (there's no shared backend).
- Bundle pricing is automatic: every top + bottom pair in the cart is billed at $95 instead of $110.
- Ribbed and Foil fabrics add $5 each *per color selection*, so a top with two ribbed swatches is `$55 + $5 + $5 = $65`.
- Payment is manual: the cart shows the total and prompts the buyer to send it via Venmo or PayPal, then email a screenshot + order details. You confirm the order by email.

## Receiving orders

Right now the buyer manually emails the order details after paying. If you want orders to land in your inbox automatically without standing up a backend, the easiest add-ons are:

- **Formspree** or **Web3Forms** — free tier, replaces the "email us" step with a form that POSTs to your inbox
- **Netlify Forms** — if you deployed to Netlify, you get this built-in for free

Happy to wire up one of those whenever you want it.
