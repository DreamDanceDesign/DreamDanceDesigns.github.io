/* Cart + router + rendering. All state lives in localStorage so the cart survives reloads. */

const STORAGE_KEY = "dancewear-cart-v1";
const app = document.getElementById("app");

document.getElementById("brand-name").textContent = CONFIG.businessName;
document.getElementById("footer-name").textContent = CONFIG.businessName;
document.title = CONFIG.businessName;

const $ = (sel, root = document) => root.querySelector(sel);
const fmt = (n) => `$${n.toFixed(2)}`;

/* ---------- Cart ---------- */
function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge() {
  $("#cart-count").textContent = loadCart().length;
}

function addToCart(item) {
  const cart = loadCart();
  cart.push({ ...item, addedAt: Date.now(), lineId: crypto.randomUUID() });
  saveCart(cart);
}

function removeFromCart(lineId) {
  saveCart(loadCart().filter(i => i.lineId !== lineId));
}

/* ---------- Pricing ---------- */
function computeTotals(cart) {
  // Bundle pricing: pair up tops and bottoms, each pair = $95 instead of $110.
  const tops = cart.filter(i => i.type === "top");
  const bottoms = cart.filter(i => i.type === "bottom");
  const bundlePairs = Math.min(tops.length, bottoms.length);
  const singleCount = cart.length - (bundlePairs * 2);

  const baseSubtotal = bundlePairs * CONFIG.pricing.bundle + singleCount * CONFIG.pricing.perItem;

  // Texture upcharge: $5 per ribbed or foil swatch selected on each item.
  const upcharge = cart.reduce((sum, item) => {
    let s = 0;
    if (item.color1Group && item.color1Group !== "standard") s += CONFIG.pricing.textureUpcharge;
    if (item.color2Group && item.color2Group !== "standard") s += CONFIG.pricing.textureUpcharge;
    return sum + s;
  }, 0);

  return { bundlePairs, singleCount, baseSubtotal, upcharge, total: baseSubtotal + upcharge };
}

/* ---------- Router ---------- */
function router() {
  const hash = location.hash || "#/";
  if (hash === "#/" || hash === "") return renderHome();
  if (hash === "#/cart") return renderCart();
  if (hash.startsWith("#/product/")) return renderProduct(hash.replace("#/product/", ""));
  return renderHome();
}

window.addEventListener("hashchange", () => { router(); window.scrollTo(0, 0); });

/* ---------- Home ---------- */
function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <h1><span class="accent">Handmade</span> dancewear,<br/>made just for you.</h1>
      <span class="divider"></span>
      <p>${CONFIG.tagline} Pick a style, pick your fabrics, and your custom piece will be sewn and shipped within a few weeks.</p>
    </section>

    <section class="collection" id="tops">
      <div class="collection-head">
        <h2>Tops</h2>
        <span class="meta">3 styles · from ${fmt(CONFIG.pricing.perItem)}</span>
      </div>
      <div class="product-grid">
        ${PRODUCTS.tops.map(productCard).join("")}
      </div>
    </section>

    <section class="collection" id="bottoms">
      <div class="collection-head">
        <h2>Bottoms</h2>
        <span class="meta">3 styles · from ${fmt(CONFIG.pricing.perItem)}</span>
      </div>
      <div class="product-grid">
        ${PRODUCTS.bottoms.map(productCard).join("")}
      </div>
    </section>

    <section class="collection">
      <div class="bundle-note">
        <strong>Bundle &amp; save:</strong> pair any top with any bottom for ${fmt(CONFIG.pricing.bundle)} instead of ${fmt(CONFIG.pricing.perItem * 2)}.
      </div>
    </section>
  `;
}

function productCard(p) {
  const img = p.img ? `<img src="${p.img}" alt="${p.name}">` : `<span>${p.name}</span>`;
  return `
    <a class="product-card" href="#/product/${p.id}">
      <div class="product-thumb">${img}</div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="price">${fmt(CONFIG.pricing.perItem)} · custom fabric</p>
      </div>
    </a>
  `;
}

/* ---------- Product detail ---------- */
function findProduct(id) {
  return [...PRODUCTS.tops, ...PRODUCTS.bottoms].find(p => p.id === id);
}

const productState = { textureTab: "standard", color1: null, color2: null };

function renderProduct(id) {
  const p = findProduct(id);
  if (!p) return renderHome();

  // reset state when navigating to a product
  productState.textureTab = "standard";
  productState.color1 = null;
  productState.color2 = null;

  const img = p.img ? `<img src="${p.img}" alt="${p.name}">` : `<span>${p.name}</span>`;

  app.innerHTML = `
    <div class="product-detail">
      <div>
        <a class="back-link" href="#/">← Back to shop</a>
        <div class="detail-image">${img}</div>
      </div>
      <div class="detail-info">
        <a class="back-link" href="#/">← Back to shop</a>
        <h1>${p.name}</h1>
        <p class="price-line">${fmt(CONFIG.pricing.perItem)} · or ${fmt(CONFIG.pricing.bundle)} as a top + bottom bundle</p>
        <p class="desc">${p.desc}</p>

        <div class="picker-section">
          <div class="picker-label">
            <h4>Fabric</h4>
          </div>
          <div class="texture-tabs" id="texture-tabs">
            ${FABRIC_GROUPS.map(g => `
              <button class="texture-tab ${g.id === productState.textureTab ? "active" : ""}" data-group="${g.id}">${g.label}</button>
            `).join("")}
          </div>
          <p class="texture-note" id="texture-note"></p>
        </div>

        <div class="picker-section">
          <div class="picker-label">
            <h4>Color 1</h4>
            <span class="selected" id="c1-selected">Pick a swatch</span>
          </div>
          <div class="swatch-grid" id="swatches-1"></div>
        </div>

        <div class="picker-section">
          <div class="picker-label">
            <h4>Color 2</h4>
            <span class="selected" id="c2-selected">Pick a swatch</span>
          </div>
          <div class="swatch-grid" id="swatches-2"></div>
        </div>

        <button class="add-to-cart" id="add-btn" disabled>Add to cart</button>
      </div>
    </div>
  `;

  // wire up texture tabs (once per product render)
  $("#texture-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".texture-tab");
    if (!btn) return;
    productState.textureTab = btn.dataset.group;
    document.querySelectorAll(".texture-tab").forEach(b => b.classList.toggle("active", b.dataset.group === productState.textureTab));
    renderSwatches();
  });

  // Persistent swatch click handlers (set once; renderSwatches just updates innerHTML)
  for (const slot of [1, 2]) {
    $(`#swatches-${slot}`).addEventListener("click", (e) => {
      const sw = e.target.closest(".swatch");
      if (!sw) return;
      const group = FABRIC_GROUPS.find(g => g.id === productState.textureTab);
      const swatch = group.swatches[+sw.dataset.idx];
      productState[`color${slot}`] = { name: swatch.name, group: group.id };
      $(`#c${slot}-selected`).textContent = `${swatch.name}${group.upcharge ? ` (+$${group.upcharge})` : ""}`;
      renderSwatches();
    });
  }

  $("#add-btn").addEventListener("click", () => {
    if (!productState.color1 || !productState.color2) return;
    addToCart({
      productId: p.id,
      productName: p.name,
      type: p.type,
      color1: productState.color1.name,
      color1Group: productState.color1.group,
      color2: productState.color2.name,
      color2Group: productState.color2.group
    });
    toast(`${p.name} added to cart`);
    location.hash = "#/cart";
  });

  renderSwatches();
}

function renderSwatches() {
  const group = FABRIC_GROUPS.find(g => g.id === productState.textureTab);
  $("#texture-note").textContent = group.note;

  for (const slot of [1, 2]) {
    const wrap = $(`#swatches-${slot}`);
    wrap.innerHTML = group.swatches.map((sw, i) => {
      const cls = ["swatch"];
      if (sw.sparkle) cls.push("sparkle");
      if (sw.ribbed) cls.push("ribbed");
      const sel = productState[`color${slot}`];
      if (sel && sel.name === sw.name && sel.group === group.id) cls.push("selected");
      const bg = sw.img ? `background-image:url('${sw.img}'); background-color:${sw.hex};` : `background-color:${sw.hex};`;
      return `<div class="${cls.join(" ")}" data-idx="${i}" style="${bg}" title="${sw.name}"></div>`;
    }).join("");
  }

  updateAddButton();
}

function updateAddButton() {
  const btn = $("#add-btn");
  if (!btn) return;
  const ready = productState.color1 && productState.color2;
  btn.disabled = !ready;
  if (ready) {
    const c1Up = FABRIC_GROUPS.find(g => g.id === productState.color1.group).upcharge;
    const c2Up = FABRIC_GROUPS.find(g => g.id === productState.color2.group).upcharge;
    const itemTotal = CONFIG.pricing.perItem + c1Up + c2Up;
    btn.textContent = `Add to cart — ${fmt(itemTotal)}`;
  } else {
    btn.textContent = "Pick Color 1 and Color 2 to continue";
  }
}

/* ---------- Cart page ---------- */
function renderCart() {
  const cart = loadCart();
  if (cart.length === 0) {
    app.innerHTML = `
      <div class="cart-page">
        <div class="empty-cart">
          <h2>Your cart is empty</h2>
          <p><a href="#/">Browse the collection →</a></p>
        </div>
      </div>
    `;
    return;
  }

  const t = computeTotals(cart);
  const bundleNote = t.bundlePairs > 0
    ? `<div class="bundle-note">✦ Bundle discount applied: ${t.bundlePairs} top + bottom ${t.bundlePairs === 1 ? "pair" : "pairs"} at ${fmt(CONFIG.pricing.bundle)} each (saved ${fmt(t.bundlePairs * (CONFIG.pricing.perItem * 2 - CONFIG.pricing.bundle))}).</div>`
    : `<div class="bundle-note">Add a ${cart[0].type === "top" ? "bottom" : "top"} to unlock the bundle price (${fmt(CONFIG.pricing.bundle)} for a top + bottom pair).</div>`;

  app.innerHTML = `
    <div class="cart-page">
      <h1>Your cart</h1>
      <p class="lead">Review your custom pieces below. Payment is by Venmo or PayPal.</p>

      ${cart.map(cartItemHTML).join("")}

      ${bundleNote}

      <div class="cart-totals">
        <div class="row"><span>Items (${cart.length})</span><span>${fmt(t.baseSubtotal)}</span></div>
        ${t.upcharge > 0 ? `<div class="row"><span>Fabric texture upcharge</span><span>${fmt(t.upcharge)}</span></div>` : ""}
        <div class="row total"><span>Total</span><span>${fmt(t.total)}</span></div>
      </div>

      <div class="payment">
        <h2>Pay & confirm your order</h2>
        <p class="pay-note">Send <strong>${fmt(t.total)}</strong> via Venmo or PayPal, then email a screenshot of the payment along with your order details.</p>
        <div class="pay-options">
          <a class="pay-card" href="${CONFIG.payment.venmoLink}" target="_blank" rel="noopener">
            <div class="label">Venmo</div>
            <div class="handle">${CONFIG.payment.venmoHandle}</div>
          </a>
          <a class="pay-card" href="${CONFIG.payment.paypalLink}" target="_blank" rel="noopener">
            <div class="label">PayPal</div>
            <div class="handle">${CONFIG.payment.paypalHandle}</div>
          </a>
        </div>
        <div class="contact-block">
          <p><strong>After paying:</strong> ${CONFIG.payment.note}</p>
          <p style="margin-top:0.5rem;">Send to: <strong>${CONFIG.payment.contactEmail}</strong></p>
        </div>
      </div>
    </div>
  `;

  app.querySelectorAll(".cart-item-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      removeFromCart(btn.dataset.line);
      renderCart();
    });
  });
}

function cartItemHTML(item) {
  const c1Group = FABRIC_GROUPS.find(g => g.id === item.color1Group);
  const c2Group = FABRIC_GROUPS.find(g => g.id === item.color2Group);
  const c1Tag = c1Group.upcharge ? ` <em>(${c1Group.label.split(" ")[0]} +$${c1Group.upcharge})</em>` : "";
  const c2Tag = c2Group.upcharge ? ` <em>(${c2Group.label.split(" ")[0]} +$${c2Group.upcharge})</em>` : "";
  return `
    <div class="cart-item">
      <div class="cart-item-thumb">${item.productName}</div>
      <div class="cart-item-info">
        <h4>${item.productName}</h4>
        <p class="details">
          <strong>Color 1:</strong> ${item.color1}${c1Tag}<br/>
          <strong>Color 2:</strong> ${item.color2}${c2Tag}
        </p>
      </div>
      <div class="cart-item-actions">
        <button class="cart-item-remove" data-line="${item.lineId}">Remove</button>
      </div>
    </div>
  `;
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  let el = $(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

/* ---------- Boot ---------- */
updateCartBadge();
router();
