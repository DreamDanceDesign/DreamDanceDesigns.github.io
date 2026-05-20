/* Cart, router, product flow, and order receipts.
   All state lives in localStorage so it survives reloads. No backend. */

const CART_KEY = "dancewear-cart-v1";
const ORDERS_KEY = "dancewear-orders-v1";
const app = document.getElementById("app");

// Update brand text
document.getElementById("brand-name").innerHTML =
  `${CONFIG.businessName}<span class="brand-sub">${CONFIG.subtitle}</span>`;
document.getElementById("footer-name").textContent = CONFIG.businessName;
document.title = CONFIG.businessName;

const $ = (sel, root = document) => root.querySelector(sel);
const fmt = (n) => `$${n.toFixed(2)}`;
const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- Cart storage ---------- */
function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function clearCart() {
  localStorage.removeItem(CART_KEY);
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

/* ---------- Orders storage ---------- */
function loadOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
  catch { return []; }
}
function saveOrder(order) {
  const orders = loadOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}
function findOrder(id) {
  return loadOrders().find(o => o.id === id);
}
function updateOrder(id, patch) {
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return;
  orders[idx] = { ...orders[idx], ...patch };
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}
function generateOrderId() {
  const d = new Date();
  const yyyymmdd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const rand = Array.from({length:4}, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");
  return `DDD-${yyyymmdd}-${rand}`;
}

/* ---------- Pricing ---------- */
function computeTotals(cart, fulfillment = "ship") {
  const tops = cart.filter(i => i.type === "top");
  const bottoms = cart.filter(i => i.type === "bottom");
  const bundlePairs = Math.min(tops.length, bottoms.length);
  const singleCount = cart.length - (bundlePairs * 2);
  const baseSubtotal = bundlePairs * CONFIG.pricing.bundle + singleCount * CONFIG.pricing.perItem;

  const upcharge = cart.reduce((sum, item) => {
    return sum + item.colors.reduce((s, c) => s + (c.group !== "standard" ? CONFIG.pricing.textureUpcharge : 0), 0);
  }, 0);

  const shipping = fulfillment === "ship" ? CONFIG.pricing.shipping : 0;

  return { bundlePairs, singleCount, baseSubtotal, upcharge, shipping, fulfillment, total: baseSubtotal + upcharge + shipping };
}

// Fulfillment selection persists across re-renders within the cart session.
let cartFulfillment = "ship";

function itemPrice(item) {
  const up = item.colors.reduce((s, c) => s + (c.group !== "standard" ? CONFIG.pricing.textureUpcharge : 0), 0);
  return CONFIG.pricing.perItem + up;
}

/* ---------- Router ---------- */
function router() {
  const hash = location.hash || "#/";
  if (hash === "#/" || hash === "") return renderHome();
  if (hash === "#/cart") return renderCart();
  if (hash.startsWith("#/product/")) return renderProduct(hash.replace("#/product/", ""));
  if (hash.startsWith("#/receipt/")) return renderReceipt(hash.replace("#/receipt/", ""));
  return renderHome();
}
window.addEventListener("hashchange", () => { router(); window.scrollTo(0, 0); });

/* ---------- Home ---------- */
function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <p class="slogan">Stand out in style.</p>
      <h1><span class="accent">Handmade</span> dancewear,<br/>made just for you.</h1>
      <span class="divider"></span>
      <p>${CONFIG.tagline} Pick a style, pick your fabrics, and your custom piece will be sewn and shipped within a few weeks.</p>
    </section>

    <section class="collection">
      <div class="collection-head">
        <h2>Tops</h2>
        <span class="meta">${PRODUCTS.tops.length} styles · from ${fmt(CONFIG.pricing.perItem)}</span>
      </div>
      <div class="product-grid">${PRODUCTS.tops.map(productCard).join("")}</div>
    </section>

    <section class="collection">
      <div class="collection-head">
        <h2>Bottoms</h2>
        <span class="meta">${PRODUCTS.bottoms.length} styles · from ${fmt(CONFIG.pricing.perItem)}</span>
      </div>
      <div class="product-grid">${PRODUCTS.bottoms.map(productCard).join("")}</div>
    </section>

    <section class="collection bundle-section">
      <div class="bundle-note">
        <strong>Bundle &amp; save:</strong> pair any top with any bottom for ${fmt(CONFIG.pricing.bundle)} instead of ${fmt(CONFIG.pricing.perItem * 2)}.
      </div>
    </section>

    ${customInquirySection()}
  `;

  wireCustomInquiry();
}

function customInquirySection() {
  return `
    <section class="collection inquiry-wrap" id="custom-inquiry">
      <div class="inquiry-card">
        <div class="inquiry-intro">
          <p class="kicker">Stand out in style</p>
          <h2>Want something fully custom?</h2>
          <p class="inquiry-blurb">Solo costumes, group pieces, or a one-of-a-kind design that isn't listed above — Jo-Anne loves a custom project. Tell her about your vision and she'll reach out with pricing and next steps. Custom pieces are priced individually and tend to run higher than the ready-to-order styles above.</p>
        </div>

        <form class="inquiry-form" id="inquiry-form">
          <div class="form-grid">
            <label class="field"><span>Your name</span>
              <input type="text" name="name" required autocomplete="name" placeholder="Jane Dancer">
            </label>
            <label class="field"><span>Email</span>
              <input type="email" name="email" required autocomplete="email" placeholder="you@example.com">
            </label>
            <label class="field"><span>Phone (optional)</span>
              <input type="tel" name="phone" autocomplete="tel" placeholder="(555) 555-0123">
            </label>
            <label class="field"><span>Project type</span>
              <select name="projectType" class="size-select" required>
                <option value="">— Select one —</option>
                <option>Custom piece (one item, custom design)</option>
                <option>Solo costume</option>
                <option>Group / team costumes</option>
                <option>Other / not sure</option>
              </select>
            </label>
            <label class="field"><span>Number of pieces (optional)</span>
              <input type="text" name="pieces" placeholder="e.g. 1, or 12 for a group">
            </label>
            <label class="field"><span>Date needed by (optional)</span>
              <input type="date" name="dueDate">
            </label>
            <label class="field full"><span>Describe your vision</span>
              <textarea name="vision" rows="4" required placeholder="Style, colors, fabrics, inspiration, performance details — anything that helps Jo-Anne picture it."></textarea>
            </label>
          </div>
          <button class="add-to-cart" type="submit" id="inquiry-submit">Send custom request</button>
          <p class="inquiry-status" id="inquiry-status"></p>
        </form>
      </div>
    </section>
  `;
}

function wireCustomInquiry() {
  const form = $("#inquiry-form");
  if (!form) return;
  const status = $("#inquiry-status");
  const submit = $("#inquiry-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submit.disabled = true;
    submit.textContent = "Sending...";
    status.textContent = "";
    status.className = "inquiry-status";

    const data = Object.fromEntries(new FormData(form));
    const message = [
      `CUSTOM REQUEST from the website`,
      ``,
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      data.phone ? `Phone: ${data.phone}` : null,
      ``,
      `Project type: ${data.projectType}`,
      data.pieces ? `Number of pieces: ${data.pieces}` : null,
      data.dueDate ? `Date needed by: ${data.dueDate}` : null,
      ``,
      `VISION`,
      data.vision
    ].filter(Boolean).join("\n");

    const ok = await sendWeb3Form({
      subject: `Custom request from ${data.name}`,
      replyto: data.email,
      message
    });

    if (ok) {
      form.reset();
      status.textContent = "✓ Sent! Jo-Anne will reach out within a few days.";
      status.classList.add("good");
      submit.textContent = "Send another request";
      submit.disabled = false;
    } else {
      status.innerHTML = `Couldn't send right now. Please email <a href="mailto:${CONFIG.payment.contactEmail}">${CONFIG.payment.contactEmail}</a> directly with your request.`;
      status.classList.add("bad");
      submit.textContent = "Try again";
      submit.disabled = false;
    }
  });
}

function productCard(p) {
  const img = p.img ? `<img src="${p.img}" alt="${escapeHtml(p.name)}">` : `<span>${escapeHtml(p.name)}</span>`;
  const colorNote = p.colors.length === 1 ? "1 fabric color" : `${p.colors.length} fabric colors`;
  return `
    <a class="product-card" href="#/product/${p.id}">
      <div class="product-thumb">${img}</div>
      <div class="product-info">
        <h3>${escapeHtml(p.name)}</h3>
        <p class="price">${fmt(CONFIG.pricing.perItem)} · ${colorNote}</p>
      </div>
    </a>
  `;
}

/* ---------- Product detail ----------
   productState.selections is keyed by color key (color1, color2…) and holds
   the current texture tab and the picked swatch for that color slot.
   productState.size holds the selected size string. */
let productState = null;

function renderProduct(id) {
  const p = findProduct(id);
  if (!p) return renderHome();

  productState = {
    product: p,
    size: null,
    selections: Object.fromEntries(p.colors.map(c => [c.key, { textureTab: "standard", selected: null }]))
  };

  const img = p.img ? `<img src="${p.img}" alt="${escapeHtml(p.name)}">` : `<span>${escapeHtml(p.name)}</span>`;

  app.innerHTML = `
    <div class="product-detail">
      <div>
        <a class="back-link" href="#/">← Back to shop</a>
        <div class="detail-image">${img}</div>
        ${sizeChartHTML()}
      </div>
      <div class="detail-info">
        <a class="back-link" href="#/">← Back to shop</a>
        <h1>${escapeHtml(p.name)}</h1>
        <p class="price-line">${fmt(CONFIG.pricing.perItem)} · or ${fmt(CONFIG.pricing.bundle)} as a top + bottom bundle</p>
        <p class="desc">${escapeHtml(p.desc)}</p>

        ${p.colors.map(c => colorPickerSection(c)).join("")}

        <div class="combo-preview" id="combo-preview" hidden></div>

        ${sizePickerSection()}

        <button class="add-to-cart" id="add-btn" disabled>Pick your fabrics and size to continue</button>
      </div>
    </div>
  `;

  // wire up texture tabs and swatches for each color zone
  p.colors.forEach(c => {
    $(`#tabs-${c.key}`).addEventListener("click", (e) => {
      const btn = e.target.closest(".texture-tab");
      if (!btn) return;
      productState.selections[c.key].textureTab = btn.dataset.group;
      renderColorSection(c);
    });
    $(`#swatches-${c.key}`).addEventListener("click", (e) => {
      const sw = e.target.closest(".swatch");
      if (!sw) return;
      const sel = productState.selections[c.key];
      const group = FABRIC_GROUPS.find(g => g.id === sel.textureTab);
      const swatch = group.swatches[+sw.dataset.idx];
      sel.selected = { name: swatch.name, group: group.id };
      renderColorSection(c);
      renderComboPreview();
      updateAddButton();
    });
  });

  $("#size-select").addEventListener("change", (e) => {
    productState.size = e.target.value || null;
    updateAddButton();
  });

  $("#add-btn").addEventListener("click", () => {
    if (!isReadyToAdd()) return;
    const colors = p.colors.map(c => ({
      label: c.label,
      name: productState.selections[c.key].selected.name,
      group: productState.selections[c.key].selected.group
    }));
    addToCart({
      productId: p.id,
      productName: p.name,
      type: p.type,
      size: productState.size,
      colors
    });
    toast(`${p.name} added to cart`);
    location.hash = "#/cart";
  });

  // initial render for each color section
  p.colors.forEach(renderColorSection);
  updateAddButton();
}

function findProduct(id) {
  return [...PRODUCTS.tops, ...PRODUCTS.bottoms].find(p => p.id === id);
}

function sizeChartHTML() {
  const tableRows = (rows) => rows.map(r => `
    <tr><th>${escapeHtml(r.size)}</th>${r.values.map(v => `<td>${escapeHtml(v)}</td>`).join("")}</tr>
  `).join("");
  const header = `<tr><th>Size</th>${SIZE_CHART.columns.map(c => `<th>${c}</th>`).join("")}</tr>`;
  return `
    <details class="size-chart">
      <summary>
        <span>Size chart</span>
        <span class="size-hint">All measurements in ${SIZE_CHART.unit}</span>
      </summary>
      <div class="size-chart-body">
        <h4 class="size-section">Children</h4>
        <div class="size-table-wrap">
          <table class="size-table">
            <thead>${header}</thead>
            <tbody>${tableRows(SIZE_CHART.children)}</tbody>
          </table>
        </div>
        <h4 class="size-section">Adults</h4>
        <div class="size-table-wrap">
          <table class="size-table">
            <thead>${header}</thead>
            <tbody>${tableRows(SIZE_CHART.adults)}</tbody>
          </table>
        </div>
        <p class="size-note">Not sure about your size? Reach out via the custom request form for help picking the right fit.</p>
      </div>
    </details>
  `;
}

function sizePickerSection() {
  const optGroup = (label, rows) => `
    <optgroup label="${label}">
      ${rows.map(r => `<option value="${escapeHtml(label)} – ${escapeHtml(r.size)}">${escapeHtml(r.size)}</option>`).join("")}
    </optgroup>
  `;
  return `
    <div class="picker-section">
      <div class="picker-label">
        <h4>Size</h4>
        <span class="selected" id="selected-size">Pick a size</span>
      </div>
      <select id="size-select" class="size-select">
        <option value="">— Select a size —</option>
        ${optGroup("Childrens", SIZE_CHART.children)}
        ${optGroup("Adults", SIZE_CHART.adults)}
      </select>
      <p class="texture-note">See the size chart next to the product image to find your fit.</p>
    </div>
  `;
}

function colorPickerSection(color) {
  return `
    <div class="picker-section">
      <div class="picker-label">
        <h4>${escapeHtml(color.label)}</h4>
        <span class="selected" id="selected-${color.key}">Pick a swatch</span>
      </div>
      <div class="texture-tabs" id="tabs-${color.key}">
        ${FABRIC_GROUPS.map(g => `
          <button class="texture-tab" data-group="${g.id}">${g.label}</button>
        `).join("")}
      </div>
      <p class="texture-note" id="note-${color.key}"></p>
      <div class="swatch-grid" id="swatches-${color.key}"></div>
    </div>
  `;
}

function renderColorSection(color) {
  const sel = productState.selections[color.key];
  const group = FABRIC_GROUPS.find(g => g.id === sel.textureTab);

  // texture tabs active state
  document.querySelectorAll(`#tabs-${color.key} .texture-tab`).forEach(b => {
    b.classList.toggle("active", b.dataset.group === sel.textureTab);
  });

  $(`#note-${color.key}`).textContent = group.note;

  // swatches
  $(`#swatches-${color.key}`).innerHTML = group.swatches.map((sw, i) => {
    const cls = ["swatch"];
    if (sw.sparkle) cls.push("sparkle");
    if (sw.ribbed) cls.push("ribbed");
    if (sel.selected && sel.selected.name === sw.name && sel.selected.group === group.id) cls.push("selected");
    const bg = sw.img ? `background-image:url('${sw.img}'); background-color:${sw.hex};` : `background-color:${sw.hex};`;
    return `<div class="${cls.join(" ")}" data-idx="${i}" style="${bg}" title="${escapeHtml(sw.name)}"></div>`;
  }).join("");

  // selected label
  if (sel.selected) {
    const upTag = group.upcharge ? ` (+$${group.upcharge})` : "";
    $(`#selected-${color.key}`).textContent = `${sel.selected.name}${upTag}`;
  } else {
    $(`#selected-${color.key}`).textContent = "Pick a swatch";
  }
}

function renderComboPreview() {
  const wrap = $("#combo-preview");
  if (!wrap) return;
  const p = productState.product;
  const picks = p.colors.map(c => ({
    label: c.label,
    sel: productState.selections[c.key].selected
  }));

  // Only show preview once every color is picked.
  if (!picks.every(p => p.sel)) {
    wrap.hidden = true;
    wrap.innerHTML = "";
    return;
  }

  const swatchData = (sel) => {
    const group = FABRIC_GROUPS.find(g => g.id === sel.group);
    const swatch = group.swatches.find(s => s.name === sel.name) || {};
    const bg = swatch.img ? `background-image:url('${swatch.img}'); background-color:${swatch.hex};` : `background-color:${swatch.hex};`;
    const txtClr = isLightColor(swatch.hex) ? "#1a1a1a" : "#faf7f2";
    return { bg, txtClr, label: group.label.replace(/ \+\$\d+/, ""), name: sel.name };
  };

  wrap.hidden = false;
  wrap.innerHTML = `
    <div class="combo-head">
      <span class="kicker">Your custom design</span>
      <h4>${escapeHtml(p.name)}, just for you</h4>
    </div>
    <div class="combo-blocks ${picks.length === 1 ? "single" : ""}">
      ${picks.map(pk => {
        const s = swatchData(pk.sel);
        return `
          <div class="combo-block" style="${s.bg}">
            <div class="combo-inner" style="color:${s.txtClr};">
              <span class="zone">${escapeHtml(pk.label)}</span>
              <span class="name">${escapeHtml(s.name)}</span>
              <span class="texture">${escapeHtml(s.label)}</span>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

// Quick luminance check so text on light swatches stays readable.
function isLightColor(hex) {
  if (!hex) return false;
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  // Standard luminance formula
  return (0.299 * r + 0.587 * g + 0.114 * b) > 160;
}

function isReadyToAdd() {
  const colorsOk = productState.product.colors.every(c => productState.selections[c.key].selected);
  return colorsOk && !!productState.size;
}

function updateAddButton() {
  const btn = $("#add-btn");
  if (!btn) return;

  const sel = $("#selected-size");
  if (sel) sel.textContent = productState.size || "Pick a size";

  if (!isReadyToAdd()) {
    btn.disabled = true;
    const missing = productState.product.colors.filter(c => !productState.selections[c.key].selected).map(c => c.label);
    if (!productState.size) missing.push("size");
    btn.textContent = `Pick ${missing.join(", ")} to continue`;
    return;
  }
  btn.disabled = false;
  const up = productState.product.colors.reduce((s, c) => {
    const g = FABRIC_GROUPS.find(g => g.id === productState.selections[c.key].selected.group);
    return s + g.upcharge;
  }, 0);
  btn.textContent = `Add to cart — ${fmt(CONFIG.pricing.perItem + up)}`;
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

  const t = computeTotals(cart, cartFulfillment);
  const bundleNote = t.bundlePairs > 0
    ? `<div class="bundle-note">✦ Bundle discount applied: ${t.bundlePairs} top + bottom ${t.bundlePairs === 1 ? "pair" : "pairs"} at ${fmt(CONFIG.pricing.bundle)} each (saved ${fmt(t.bundlePairs * (CONFIG.pricing.perItem * 2 - CONFIG.pricing.bundle))}).</div>`
    : `<div class="bundle-note">Add a ${cart[0].type === "top" ? "bottom" : "top"} to unlock the bundle price (${fmt(CONFIG.pricing.bundle)} for a top + bottom pair).</div>`;

  app.innerHTML = `
    <div class="cart-page">
      <h1>Your cart</h1>
      <p class="lead">Review your custom pieces, fill in your details, send payment via Venmo, then place your order.</p>

      ${cart.map(cartItemHTML).join("")}

      ${bundleNote}

      <div class="checkout-section">
        <h2>Delivery</h2>
        <p class="pay-note">Choose how you'd like to receive your order.</p>
        <div class="fulfillment-options">
          <label class="fulfill-option ${cartFulfillment === "ship" ? "selected" : ""}">
            <input type="radio" name="fulfillment" value="ship" ${cartFulfillment === "ship" ? "checked" : ""}>
            <div class="fulfill-body">
              <div class="fulfill-head">
                <strong>Ship to me</strong>
                <span class="fulfill-price">${fmt(CONFIG.pricing.shipping)}</span>
              </div>
              <p class="fulfill-detail">Flat-rate shipping. Tracking information will be emailed once your order ships.</p>
            </div>
          </label>
          <label class="fulfill-option ${cartFulfillment === "pickup" ? "selected" : ""}">
            <input type="radio" name="fulfillment" value="pickup" ${cartFulfillment === "pickup" ? "checked" : ""}>
            <div class="fulfill-body">
              <div class="fulfill-head">
                <strong>Local pickup</strong>
                <span class="fulfill-price free">Free</span>
              </div>
              <p class="fulfill-detail">Jo-Anne will email you when your order is finished so you can arrange a pickup time.</p>
              <p class="fulfill-warn"><strong>Please note:</strong> selecting pickup means your order will <em>not</em> be shipped. You're responsible for coordinating and showing up to an agreed pickup time. Shipping cannot be added later.</p>
            </div>
          </label>
        </div>
      </div>

      <div class="cart-totals">
        <div class="row"><span>Items (${cart.length})</span><span>${fmt(t.baseSubtotal)}</span></div>
        ${t.upcharge > 0 ? `<div class="row"><span>Fabric texture upcharge</span><span>${fmt(t.upcharge)}</span></div>` : ""}
        <div class="row"><span>${cartFulfillment === "ship" ? "Shipping" : "Local pickup"}</span><span>${cartFulfillment === "ship" ? fmt(t.shipping) : "Free"}</span></div>
        <div class="row total"><span>Total</span><span>${fmt(t.total)}</span></div>
      </div>

      <div class="checkout-section">
        <h2>Your details</h2>
        <p class="pay-note">So Jo-Anne can match your payment and ship your order.</p>
        <div class="form-grid">
          <label class="field">
            <span>Full name</span>
            <input type="text" id="cust-name" required autocomplete="name" placeholder="Jane Dancer">
          </label>
          <label class="field">
            <span>Email</span>
            <input type="email" id="cust-email" required autocomplete="email" placeholder="you@example.com">
          </label>
          <label class="field full">
            <span>${cartFulfillment === "ship" ? "Shipping address" : "Shipping address (not needed for pickup)"}</span>
            <textarea id="cust-address" rows="3" placeholder="${cartFulfillment === "ship" ? "Street, city, state, zip" : "Leave blank for local pickup"}"></textarea>
          </label>
          <label class="field full">
            <span>Sizing &amp; notes</span>
            <textarea id="cust-notes" rows="3" placeholder="Measurements, fit preferences, any special requests"></textarea>
          </label>
        </div>
      </div>

      <div class="checkout-section payment">
        <h2>Pay with Venmo</h2>
        <p class="pay-note">Send <strong>${fmt(t.total)}</strong> to the Venmo handle below, then check the box to place your order.</p>
        <a class="pay-card solo" href="${CONFIG.payment.venmoLink}" target="_blank" rel="noopener">
          <div class="label">Venmo</div>
          <div class="handle">${CONFIG.payment.venmoHandle}</div>
          <div class="amount">${fmt(t.total)}</div>
        </a>

        <label class="confirm-box">
          <input type="checkbox" id="confirm-paid">
          <span>I have sent <strong>${fmt(t.total)}</strong> via Venmo to <strong>${CONFIG.payment.venmoHandle}</strong></span>
        </label>

        <button class="add-to-cart" id="place-order-btn" type="button">Place order →</button>

        <p class="contact-line">Questions? Email <a href="mailto:${CONFIG.payment.contactEmail}">${CONFIG.payment.contactEmail}</a></p>
      </div>
    </div>
  `;

  // remove buttons
  app.querySelectorAll(".cart-item-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      removeFromCart(btn.dataset.line);
      renderCart();
    });
  });

  // fulfillment radio
  app.querySelectorAll('input[name="fulfillment"]').forEach(r => {
    r.addEventListener("change", (e) => {
      cartFulfillment = e.target.value;
      renderCart();
    });
  });

  // place order — button is always clickable; validation gives specific feedback
  $("#place-order-btn").addEventListener("click", () => {
    const name = $("#cust-name");
    const email = $("#cust-email");
    const address = $("#cust-address");
    const notes = $("#cust-notes");
    const checkbox = $("#confirm-paid");

    // clear prior error styling
    [name, email, address].forEach(el => el.classList.remove("invalid"));

    const missing = [];
    if (!name.value.trim()) { name.classList.add("invalid"); missing.push("name"); }
    if (!email.value.trim()) { email.classList.add("invalid"); missing.push("email"); }
    if (cartFulfillment === "ship" && !address.value.trim()) { address.classList.add("invalid"); missing.push("shipping address"); }

    if (missing.length) {
      toast(`Please fill in: ${missing.join(", ")}`);
      const first = [name, email, address].find(el => el.classList.contains("invalid"));
      if (first) first.focus();
      return;
    }
    if (!checkbox.checked) {
      toast("Please check the box to confirm you've sent payment via Venmo");
      checkbox.focus();
      return;
    }

    const order = {
      id: generateOrderId(),
      placedAt: new Date().toISOString(),
      items: loadCart(),
      totals: computeTotals(loadCart(), cartFulfillment),
      fulfillment: cartFulfillment,
      customer: {
        name: name.value.trim(),
        email: email.value.trim(),
        address: address.value.trim(),
        notes: notes.value.trim()
      },
      paymentConfirmed: true,
      emailStatus: CONFIG.payment.web3formsKey ? "pending" : "manual"
    };
    saveOrder(order);
    clearCart();
    location.hash = `#/receipt/${order.id}`;

    // Fire the email after navigation; receipt will refresh once status resolves.
    if (CONFIG.payment.web3formsKey) {
      sendOrderEmail(order).then(ok => {
        updateOrder(order.id, { emailStatus: ok ? "sent" : "failed" });
        if (location.hash === `#/receipt/${order.id}`) renderReceipt(order.id);
      });
    }
  });
}

function cartItemHTML(item, { removable = true } = {}) {
  const colorLines = item.colors.map(c => {
    const g = FABRIC_GROUPS.find(g => g.id === c.group);
    const tag = g.upcharge ? ` <em>(${g.label.split(" ")[0]} +$${g.upcharge})</em>` : "";
    return `<strong>${escapeHtml(c.label)}:</strong> ${escapeHtml(c.name)}${tag}`;
  }).join("<br/>");

  const sizeLine = item.size ? `<strong>Size:</strong> ${escapeHtml(item.size)}<br/>` : "";

  return `
    <div class="cart-item">
      <div class="cart-item-thumb">${escapeHtml(item.productName)}</div>
      <div class="cart-item-info">
        <h4>${escapeHtml(item.productName)}</h4>
        <p class="details">${sizeLine}${colorLines}</p>
      </div>
      <div class="cart-item-actions">
        <span class="cart-item-price">${fmt(itemPrice(item))}</span>
        ${removable ? `<button class="cart-item-remove" data-line="${item.lineId}">Remove</button>` : ""}
      </div>
    </div>
  `;
}

/* ---------- Receipt page ---------- */
function renderReceipt(id) {
  const order = findOrder(id);
  if (!order) {
    app.innerHTML = `
      <div class="cart-page">
        <div class="empty-cart">
          <h2>Order not found</h2>
          <p>This receipt may have been placed on a different device or cleared from this browser.</p>
          <p><a href="#/">Back to shop →</a></p>
        </div>
      </div>
    `;
    return;
  }

  const placedDate = new Date(order.placedAt).toLocaleString(undefined, {
    dateStyle: "medium", timeStyle: "short"
  });

  const emailBody = buildOrderEmail(order);
  // Short mailto body (just order ID + customer) to avoid mail-client glitches with very long URIs.
  const mailtoBody = `New order ${order.id} from ${order.customer.name}.\n\nPlease view the full order details on the receipt page or copy them using the "Copy order details" button.\n\nCustomer email: ${order.customer.email}\nTotal: ${fmt(order.totals.total)}`;
  const mailto = `mailto:${CONFIG.payment.contactEmail}?subject=${encodeURIComponent(`New order ${order.id} — ${order.customer.name}`)}&body=${encodeURIComponent(mailtoBody)}`;

  app.innerHTML = `
    <div class="cart-page receipt">
      <div class="receipt-banner">
        <p class="check">✓</p>
        <h1>Order placed</h1>
        <p class="lead">Thank you! Your custom piece${order.items.length > 1 ? "s are" : " is"} on the way to being made.</p>
      </div>

      <div class="order-meta">
        <div>
          <span class="label">Order number</span>
          <span class="value mono">${order.id}</span>
        </div>
        <div>
          <span class="label">Placed</span>
          <span class="value">${placedDate}</span>
        </div>
      </div>

      <div class="receipt-section">
        <h2>What you ordered</h2>
        ${order.items.map(it => cartItemHTML(it, { removable: false })).join("")}
        <div class="cart-totals">
          <div class="row"><span>Items subtotal</span><span>${fmt(order.totals.baseSubtotal)}</span></div>
          ${order.totals.upcharge > 0 ? `<div class="row"><span>Fabric texture upcharge</span><span>${fmt(order.totals.upcharge)}</span></div>` : ""}
          <div class="row"><span>${order.fulfillment === "ship" ? "Shipping" : "Local pickup"}</span><span>${order.fulfillment === "ship" ? fmt(order.totals.shipping) : "Free"}</span></div>
          <div class="row total"><span>Total paid</span><span>${fmt(order.totals.total)}</span></div>
        </div>
      </div>

      <div class="receipt-section">
        <h2>${order.fulfillment === "ship" ? "Shipping to" : "Pickup contact"}</h2>
        <p class="address">
          <strong>${escapeHtml(order.customer.name)}</strong><br/>
          ${escapeHtml(order.customer.email)}<br/>
          ${order.fulfillment === "ship" ? escapeHtml(order.customer.address).replace(/\n/g, "<br/>") : "<em>Local pickup — Jo-Anne will email to arrange a pickup time.</em>"}
        </p>
        ${order.customer.notes ? `<p class="notes"><strong>Notes:</strong> ${escapeHtml(order.customer.notes)}</p>` : ""}
      </div>

      <div class="receipt-section">
        <h2>What happens next</h2>
        <div class="timeline-block">
          <p><strong>Timeline:</strong> Most orders take around <strong>${escapeHtml(CONFIG.timeline.standardDays)}</strong> to make. Please allow up to <strong>${escapeHtml(CONFIG.timeline.maxDays)}</strong> in case Jo-Anne needs to order additional materials.</p>
          ${order.fulfillment === "ship"
            ? `<p>Once your order ships, <strong>tracking information will be emailed to ${escapeHtml(order.customer.email)}</strong> as soon as possible.</p>`
            : `<p>When your order is finished, Jo-Anne will <strong>email ${escapeHtml(order.customer.email)}</strong> to coordinate a pickup time. You're responsible for arranging and showing up to an agreed time — shipping is not available for pickup orders.</p>`
          }
        </div>
      </div>

      ${emailStatusSection(order, mailto)}

      <p style="text-align:center; margin-top:2rem;"><a class="back-link" href="#/">← Back to shop</a></p>
    </div>
  `;

  const copyBtn = $("#copy-order-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(emailBody);
        toast("Order details copied to clipboard");
      } catch {
        toast("Couldn't copy — try selecting the text manually");
      }
    });
  }

  const retryBtn = $("#retry-send-btn");
  if (retryBtn) {
    retryBtn.addEventListener("click", async () => {
      retryBtn.disabled = true;
      retryBtn.textContent = "Sending...";
      const ok = await sendOrderEmail(order);
      updateOrder(order.id, { emailStatus: ok ? "sent" : "failed" });
      renderReceipt(order.id);
    });
  }
}

/* ---------- Order email rendering + sending ---------- */
function buildOrderEmail(order) {
  const placedDate = new Date(order.placedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  const itemsText = order.items.map(it => {
    const sizeText = it.size ? `\n    Size: ${it.size}` : "";
    const colorLines = it.colors.map(c => {
      const g = FABRIC_GROUPS.find(g => g.id === c.group);
      return `    ${c.label}: ${c.name}${g.upcharge ? ` (${g.label})` : ""}`;
    }).join("\n");
    return `• ${it.productName} — ${fmt(itemPrice(it))}${sizeText}\n${colorLines}`;
  }).join("\n\n");

  const fulfillmentLine = order.fulfillment === "pickup"
    ? `Fulfillment: LOCAL PICKUP — coordinate pickup time with customer by email`
    : `Fulfillment: SHIP — send tracking info to customer when shipped`;

  return [
    `New order: ${order.id}`,
    `Placed: ${placedDate}`,
    ``,
    fulfillmentLine,
    ``,
    `CUSTOMER`,
    `Name: ${order.customer.name}`,
    `Email: ${order.customer.email}`,
    order.fulfillment === "ship" ? `Address: ${order.customer.address}` : `Address: (local pickup — none provided)`,
    order.customer.notes ? `Notes: ${order.customer.notes}` : null,
    ``,
    `ITEMS`,
    itemsText,
    ``,
    `TOTALS`,
    `Items subtotal: ${fmt(order.totals.baseSubtotal)}`,
    order.totals.upcharge ? `Fabric upcharge: ${fmt(order.totals.upcharge)}` : null,
    order.fulfillment === "ship" ? `Shipping: ${fmt(order.totals.shipping)}` : `Shipping: Free (local pickup)`,
    `Total: ${fmt(order.totals.total)}`,
    ``,
    `Payment: Confirmed via Venmo to ${CONFIG.payment.venmoHandle}`
  ].filter(Boolean).join("\n");
}

async function sendWeb3Form({ subject, replyto, message }) {
  if (!CONFIG.payment.web3formsKey) return false;
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: CONFIG.payment.web3formsKey,
        subject,
        from_name: "Dream Dance Designs Website",
        replyto,
        message
      })
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data.success !== false;
  } catch (e) {
    console.error("Web3Forms send failed:", e);
    return false;
  }
}

function sendOrderEmail(order) {
  return sendWeb3Form({
    subject: `New order ${order.id} — ${order.customer.name}`,
    replyto: order.customer.email,
    message: buildOrderEmail(order)
  });
}

function emailStatusSection(order, mailto) {
  const status = order.emailStatus || "pending";

  // Auto-send succeeded — clean confirmation, no action needed.
  if (status === "sent") {
    return `
      <div class="receipt-section action-section status-good">
        <h2>✓ Order sent to Jo-Anne</h2>
        <p class="pay-note">Your order details were emailed automatically. She'll match your Venmo payment and start sewing.</p>
        <p class="contact-line">Keep this page bookmarked — your order number is <strong class="mono">${order.id}</strong>. Questions? Email <a href="mailto:${CONFIG.payment.contactEmail}">${CONFIG.payment.contactEmail}</a>.</p>
      </div>
    `;
  }

  // Auto-send still in flight — show a calm loading state.
  if (status === "pending") {
    return `
      <div class="receipt-section action-section">
        <h2>Sending your order to Jo-Anne…</h2>
        <p class="pay-note">Just a moment. This page will update once it's been delivered.</p>
        <p class="contact-line">Your order number is <strong class="mono">${order.id}</strong>.</p>
      </div>
    `;
  }

  // status === "failed" or "manual" — show the fallback buttons.
  const heading = status === "failed" ? "We couldn't auto-send your order" : "One last step";
  const blurb = status === "failed"
    ? "The automatic email didn't go through. You can retry, send it from your email app, or copy the details and paste them into an email to Jo-Anne."
    : "Please send your order details to Jo-Anne so she can confirm your payment and start sewing.";

  return `
    <div class="receipt-section action-section ${status === "failed" ? "status-warn" : ""}">
      <h2>${heading}</h2>
      <p class="pay-note">${blurb}</p>
      <div class="receipt-actions">
        ${CONFIG.payment.web3formsKey ? `<button class="add-to-cart primary-action" id="retry-send-btn" type="button">Retry sending</button>` : `<a class="add-to-cart primary-action" href="${mailto}">📧 Email order to Jo-Anne</a>`}
        <button class="secondary-action" id="copy-order-btn" type="button">Copy order details</button>
      </div>
      <p class="contact-line">Or email <a href="mailto:${CONFIG.payment.contactEmail}">${CONFIG.payment.contactEmail}</a> directly. Order number: <strong class="mono">${order.id}</strong>.</p>
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
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

/* ---------- Boot ---------- */
updateCartBadge();
router();
