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
function generateOrderId() {
  const d = new Date();
  const yyyymmdd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const rand = Array.from({length:4}, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");
  return `DDD-${yyyymmdd}-${rand}`;
}

/* ---------- Pricing ---------- */
function computeTotals(cart) {
  const tops = cart.filter(i => i.type === "top");
  const bottoms = cart.filter(i => i.type === "bottom");
  const bundlePairs = Math.min(tops.length, bottoms.length);
  const singleCount = cart.length - (bundlePairs * 2);
  const baseSubtotal = bundlePairs * CONFIG.pricing.bundle + singleCount * CONFIG.pricing.perItem;

  const upcharge = cart.reduce((sum, item) => {
    return sum + item.colors.reduce((s, c) => s + (c.group !== "standard" ? CONFIG.pricing.textureUpcharge : 0), 0);
  }, 0);

  return { bundlePairs, singleCount, baseSubtotal, upcharge, total: baseSubtotal + upcharge };
}

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

    <section class="collection">
      <div class="bundle-note">
        <strong>Bundle &amp; save:</strong> pair any top with any bottom for ${fmt(CONFIG.pricing.bundle)} instead of ${fmt(CONFIG.pricing.perItem * 2)}.
      </div>
    </section>
  `;
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
   the current texture tab and the picked swatch for that color slot. */
let productState = null;

function renderProduct(id) {
  const p = findProduct(id);
  if (!p) return renderHome();

  productState = {
    product: p,
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

        <button class="add-to-cart" id="add-btn" disabled>Pick your fabrics to continue</button>
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
      updateAddButton();
    });
  });

  $("#add-btn").addEventListener("click", () => {
    if (!allColorsPicked()) return;
    const colors = p.colors.map(c => ({
      label: c.label,
      name: productState.selections[c.key].selected.name,
      group: productState.selections[c.key].selected.group
    }));
    addToCart({
      productId: p.id,
      productName: p.name,
      type: p.type,
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
        <p class="size-note">Between sizes? Mention your exact measurements in the order notes — every piece is made to order.</p>
      </div>
    </details>
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

function allColorsPicked() {
  return productState.product.colors.every(c => productState.selections[c.key].selected);
}

function updateAddButton() {
  const btn = $("#add-btn");
  if (!btn) return;
  if (!allColorsPicked()) {
    btn.disabled = true;
    const missing = productState.product.colors.filter(c => !productState.selections[c.key].selected).map(c => c.label);
    btn.textContent = `Pick ${missing.join(" and ")} to continue`;
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

  const t = computeTotals(cart);
  const bundleNote = t.bundlePairs > 0
    ? `<div class="bundle-note">✦ Bundle discount applied: ${t.bundlePairs} top + bottom ${t.bundlePairs === 1 ? "pair" : "pairs"} at ${fmt(CONFIG.pricing.bundle)} each (saved ${fmt(t.bundlePairs * (CONFIG.pricing.perItem * 2 - CONFIG.pricing.bundle))}).</div>`
    : `<div class="bundle-note">Add a ${cart[0].type === "top" ? "bottom" : "top"} to unlock the bundle price (${fmt(CONFIG.pricing.bundle)} for a top + bottom pair).</div>`;

  app.innerHTML = `
    <div class="cart-page">
      <h1>Your cart</h1>
      <p class="lead">Review your custom pieces, fill in your details, send payment via Venmo, then place your order.</p>

      ${cart.map(cartItemHTML).join("")}

      ${bundleNote}

      <div class="cart-totals">
        <div class="row"><span>Items (${cart.length})</span><span>${fmt(t.baseSubtotal)}</span></div>
        ${t.upcharge > 0 ? `<div class="row"><span>Fabric texture upcharge</span><span>${fmt(t.upcharge)}</span></div>` : ""}
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
            <span>Shipping address</span>
            <textarea id="cust-address" rows="3" required placeholder="Street, city, state, zip"></textarea>
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
    if (!address.value.trim()) { address.classList.add("invalid"); missing.push("address"); }

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
      totals: computeTotals(loadCart()),
      customer: {
        name: name.value.trim(),
        email: email.value.trim(),
        address: address.value.trim(),
        notes: notes.value.trim()
      },
      paymentConfirmed: true
    };
    saveOrder(order);
    clearCart();
    location.hash = `#/receipt/${order.id}`;
  });
}

function cartItemHTML(item) {
  const colorLines = item.colors.map(c => {
    const g = FABRIC_GROUPS.find(g => g.id === c.group);
    const tag = g.upcharge ? ` <em>(${g.label.split(" ")[0]} +$${g.upcharge})</em>` : "";
    return `<strong>${escapeHtml(c.label)}:</strong> ${escapeHtml(c.name)}${tag}`;
  }).join("<br/>");

  return `
    <div class="cart-item">
      <div class="cart-item-thumb">${escapeHtml(item.productName)}</div>
      <div class="cart-item-info">
        <h4>${escapeHtml(item.productName)}</h4>
        <p class="details">${colorLines}</p>
      </div>
      <div class="cart-item-actions">
        <span class="cart-item-price">${fmt(itemPrice(item))}</span>
        <button class="cart-item-remove" data-line="${item.lineId}">Remove</button>
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

  const itemsText = order.items.map(it => {
    const lines = it.colors.map(c => `    ${c.label}: ${c.name}${FABRIC_GROUPS.find(g=>g.id===c.group).upcharge ? ` (${FABRIC_GROUPS.find(g=>g.id===c.group).label})` : ""}`).join("\n");
    return `• ${it.productName} — ${fmt(itemPrice(it))}\n${lines}`;
  }).join("\n\n");

  const emailBody = [
    `New order: ${order.id}`,
    `Placed: ${placedDate}`,
    ``,
    `CUSTOMER`,
    `Name: ${order.customer.name}`,
    `Email: ${order.customer.email}`,
    `Address: ${order.customer.address}`,
    order.customer.notes ? `Notes: ${order.customer.notes}` : null,
    ``,
    `ITEMS`,
    itemsText,
    ``,
    `TOTALS`,
    `Items subtotal: ${fmt(order.totals.baseSubtotal)}`,
    order.totals.upcharge ? `Fabric upcharge: ${fmt(order.totals.upcharge)}` : null,
    `Total: ${fmt(order.totals.total)}`,
    ``,
    `Payment: Confirmed via Venmo to ${CONFIG.payment.venmoHandle}`
  ].filter(Boolean).join("\n");

  const mailto = `mailto:${CONFIG.payment.contactEmail}?subject=${encodeURIComponent(`New order ${order.id} — ${order.customer.name}`)}&body=${encodeURIComponent(emailBody)}`;

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
        ${order.items.map(cartItemHTML).join("")}
        <div class="cart-totals">
          <div class="row"><span>Items subtotal</span><span>${fmt(order.totals.baseSubtotal)}</span></div>
          ${order.totals.upcharge > 0 ? `<div class="row"><span>Fabric texture upcharge</span><span>${fmt(order.totals.upcharge)}</span></div>` : ""}
          <div class="row total"><span>Total paid</span><span>${fmt(order.totals.total)}</span></div>
        </div>
      </div>

      <div class="receipt-section">
        <h2>Shipping to</h2>
        <p class="address">
          <strong>${escapeHtml(order.customer.name)}</strong><br/>
          ${escapeHtml(order.customer.email)}<br/>
          ${escapeHtml(order.customer.address).replace(/\n/g, "<br/>")}
        </p>
        ${order.customer.notes ? `<p class="notes"><strong>Notes:</strong> ${escapeHtml(order.customer.notes)}</p>` : ""}
      </div>

      <div class="receipt-section action-section">
        <h2>One last step</h2>
        <p class="pay-note">Please send your order details to Jo-Anne so she can confirm your payment and start sewing.</p>
        <div class="receipt-actions">
          <a class="add-to-cart primary-action" href="${mailto}">📧 Email order to Jo-Anne</a>
          <button class="secondary-action" id="copy-order-btn">Copy order details</button>
        </div>
        <p class="contact-line">Or email <a href="mailto:${CONFIG.payment.contactEmail}">${CONFIG.payment.contactEmail}</a> directly. Keep this page bookmarked — your order number is <strong class="mono">${order.id}</strong>.</p>
      </div>

      <p style="text-align:center; margin-top:2rem;"><a class="back-link" href="#/">← Back to shop</a></p>
    </div>
  `;

  $("#copy-order-btn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      toast("Order details copied to clipboard");
    } catch {
      toast("Couldn't copy — try selecting the text manually");
    }
  });
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
