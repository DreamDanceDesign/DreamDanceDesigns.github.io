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

### Adding product preview images (step by step)

The product cards on the home page and the big image on each product page currently show a placeholder with the product name. Here's how to swap in real photos:

**1. Create an `images/` folder** next to `index.html`. On GitHub, you can do this in one step: repo page → Add file → Upload files → drag in an image, then in the filename box type `images/ruched-bralette.jpg` (typing the slash creates the folder).

**2. Prepare each photo** — recommended specs for the cleanest look:
- **Portrait orientation**, roughly **800×1000 pixels** (3:4 aspect ratio matches the product card)
- **JPG** for photos, under ~300 KB each so the site stays fast
- **Plain background** (white, cream, or a soft color) looks the most polished alongside the site's aesthetic
- Name files with simple lowercase + dashes: `ruched-bralette.jpg`, `one-shoulder-top.jpg`, `longline-ruched-top.jpg`, `booty-shorts.jpg`, `standard-brief.jpg`, `featured-brief.jpg`

**3. Open [data.js](data.js)** and find the `PRODUCTS` block. For each product, change `img: null` to point at the file:

```js
{
  id: "top-1",
  name: "Ruched Bralette",
  type: "top",
  desc: "...",
  img: "images/ruched-bralette.jpg",    // ← change null to this
  colors: [...]
}
```

**4. Save and deploy.** If you're on GitHub Pages, commit the updated `data.js` + the uploaded images. Site updates in ~30 seconds.

That's it — the placeholder will be replaced with your photo automatically on both the home page card and the big product page image.

### Adding real fabric swatch photos later

Same idea, but for the small color swatches:
1. Crop each swatch from the fabric board photos into a square (~200×200 pixels works well)
2. Save them under `swatches/` with simple names: `carminio.jpg`, `black.jpg`, etc.
3. In [data.js](data.js), find the swatch in `FABRIC_GROUPS` and add an `img` field:

```js
{ name: "Carminio", hex: "#d7522c", img: "swatches/carminio.jpg" }
```

Keep the `hex` as a fallback — if the image fails to load, the solid color shows instead.

## Deploying for free

### Option 1 — Netlify (recommended, takes ~2 minutes)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire `dancewear-site` folder onto the page
3. You get a live URL like `wandering-violet-1234.netlify.app`
4. Optional: sign up (free) to claim a custom subdomain or attach a real domain

No account needed to start. To push updates, drag the folder again, or sign up and connect a GitHub repo for auto-deploys.

### Option 2 — GitHub Pages (free, version-controlled)

1. Create a free GitHub account
2. Create a new **public** repo (e.g., `dancewear`)
3. Upload these files to it — they must sit **at the root of the repo**, not inside a subfolder. After uploading, you should see `index.html`, `styles.css`, `app.js`, `data.js`, `README.md` listed at the top level.
4. Settings → Pages → Source: **Deploy from a branch** → Branch: `main` → Folder: `/ (root)` → Save
5. Wait ~1 minute. Pages will display: *"Your site is live at https://`<your-username>`.github.io/dancewear/"*

### Getting "404 Not Found" on your Pages URL?

Run through this checklist — at least one of these is almost always the cause:

1. **Did Pages finish building?** Settings → Pages shows a status. You want a green checkmark + "Your site is live at…". If it shows yellow/orange or "Building", wait another minute and refresh.
2. **Is the Source set to a branch?** Settings → Pages → Build and deployment → Source must say **Deploy from a branch**, Branch = **main**, Folder = **/ (root)**. If Source says "GitHub Actions", switch it to "Deploy from a branch".
3. **Are the files at the root of the repo?** Open the repo's main page. You should see `index.html` directly in the file list. If everything is inside a folder like `dancewear-site/`, GitHub Pages is looking at the wrong level — either move the files up, or set the Pages folder to that subfolder if available (only `/ (root)` and `/docs` are options).
4. **Is the URL right?** Format is `https://<your-github-username>.github.io/<repo-name>/` — case-sensitive on the repo name, and the trailing slash matters. Example: `https://janedoe.github.io/dancewear/`.
5. **Is the repo public?** Free GitHub Pages only works for public repos. Settings → General → scroll to "Danger Zone" → "Change visibility" if needed.
6. **Hard refresh.** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows). Browsers cache 404 pages aggressively.

If you're still stuck, share the repo URL and I can walk through it.

### Updating after deployment

Two ways:

- **Quick text/price tweaks** — open the file on github.com, click the pencil ✏️ icon, edit, scroll down → Commit changes. Live in ~30 seconds.
- **Adding files (like product photos)** — repo page → Add file → Upload files → drag in. Commit. Live in ~30 seconds.

Every commit auto-rebuilds the site. Hit Cmd+Shift+R if you don't see changes immediately.

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

## Receiving orders automatically (Web3Forms setup — 2 minutes)

The site is already wired up to send each order straight to Jo-Anne's inbox using [Web3Forms](https://web3forms.com) — a free service (**250 emails/month**, no account needed). You just need to plug in an access key.

### One-time setup

1. Go to **[web3forms.com](https://web3forms.com)**
2. On the homepage, find the "Get Your Access Key" form
3. Enter **`DreamDanceDesigns@gmail.com`** and your name → click **Create Access Key**
4. Check the DreamDanceDesigns Gmail inbox for an email from Web3Forms — it contains an **Access Key** that looks like `a1b2c3d4-e5f6-7890-abcd-ef0123456789`
5. Open [data.js](data.js), find this line near the top:
   ```js
   web3formsKey: ""
   ```
   Paste the key inside the quotes:
   ```js
   web3formsKey: "a1b2c3d4-e5f6-7890-abcd-ef0123456789"
   ```
6. Save the file. If you're on GitHub Pages, commit the change — the site will be live in ~30 seconds.

### Test it

Place a test order on the site. After clicking "Place order," you should see:
- A receipt page with order number
- A green ✓ banner: *"Order sent to Jo-Anne"*
- An email arrives at DreamDanceDesigns@gmail.com within seconds with all the order details (customer name, address, size, fabric choices, total, etc.)

### If something goes wrong

The receipt page handles failures gracefully:
- **Still sending…** — request in flight (usually under 5 seconds)
- **⚠ Couldn't auto-send** — the customer sees a "Retry sending" button and a fallback "Copy order details" button. They can also email the contact address directly.

If you ever leave `web3formsKey` empty, the site falls back to a "📧 Email order to Jo-Anne" button that opens the customer's mail app — same as before but the body is short to avoid mail-app glitches.

### Why not a separate email account?

You don't need one — Web3Forms is the "sender" so emails will appear in your inbox as coming from Web3Forms with a reply-to set to the customer (so hitting Reply emails them back). Much simpler than running a separate sending account.

### Alternatives if you outgrow 250/month

- **Formspree** — free 50/month, paid tiers from $10/mo for more
- **Resend** — better deliverability, free 3,000/month, requires a tiny bit of code
- **EmailJS** — 200/month free
- I can wire any of these up if Web3Forms ever isn't enough.
