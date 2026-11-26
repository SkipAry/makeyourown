import {
  catalog,
  categories,
  toppings,
  sizes,
  config,
  money,
  esc,
  unitPrice,
  lineKey,
  addLine,
  editLine,
  total,
  quantity,
  itemName,
  detail,
  isPizza,
  isPreview,
  validateCheckout,
  whatsappDraft,
} from "./model.mjs";

const $ = (id) => document.getElementById(id),
  app = $("app"),
  sheet = $("sheet");
const clone = (x) => JSON.parse(JSON.stringify(x));
const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem("romae.v2." + key));
    if (value === null) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(value)) return fallback;
    if (
      fallback &&
      typeof fallback === "object" &&
      !Array.isArray(fallback) &&
      (typeof value !== "object" || Array.isArray(value))
    )
      return fallback;
    return value;
  } catch {
    return fallback;
  }
};
let storageWarning = false;
function write(key, value) {
  try {
    localStorage.setItem("romae.v2." + key, JSON.stringify(value));
  } catch {
    if (!storageWarning) {
      storageWarning = true;
      toast("Storage is unavailable. Keep this tab open to retain your draft.");
    }
  }
}
let cart = [];
for (const line of read("cart", [])) {
  try {
    addLine(
      cart,
      config(line.productId, line.size, line.counts, line.quantity),
    );
  } catch {
    /* Ignore obsolete catalog entries. */
  }
}
let profile = read("profile", { name: "", phone: "" });
let checkout = {
  mode: "pickup",
  name: profile.name || "",
  phone: profile.phone || "",
  table: "",
  note: "",
  ...read("checkout", {}),
};
let draft;
try {
  const saved = read("builder", null);
  draft = saved
    ? {
        ...config(saved.productId, saved.size, saved.counts, saved.quantity),
        editKey: saved.editKey || null,
      }
    : config();
} catch {
  draft = config();
}
let savedOrders = read("orders", []),
  supportDraft = read("support", { topic: "", message: "" });
let currentRoute = "",
  menuScroll = 0,
  previewPhase = "editing",
  sheetDraft = null,
  errors = {},
  toastTimer,
  undoAction = null,
  observer = null;
const asset = (photo) => "assets/" + photo;
const categoryId = (category) => "category-" + category.toLowerCase();
function toast(text, undo = null) {
  clearTimeout(toastTimer);
  $("toast-copy").textContent = text;
  $("toast").hidden = false;
  $("undo").hidden = !undo;
  undoAction = undo;
  toastTimer = setTimeout(
    () => {
      $("toast").hidden = true;
      undoAction = null;
    },
    undo ? 8000 : 3500,
  );
}
$("undo").onclick = () => {
  if (undoAction) undoAction();
  $("toast").hidden = true;
  undoAction = null;
};
function persistCart() {
  write("cart", cart);
  updateHeader();
}
function persistBuilder() {
  write("builder", draft);
}
function updateHeader() {
  const count = quantity(cart);
  $("bag-count").textContent = count;
  $("header-bag").setAttribute(
    "aria-label",
    `Your order, ${count} ${count === 1 ? "item" : "items"}`,
  );
}
function stepper(line, index, context = "cart") {
  return `<div class="stepper" role="group" aria-label="Quantity for ${esc(itemName(line))}"><button data-action="${context}-step" data-index="${index}" data-step="-1" aria-label="${line.quantity === 1 ? "Remove" : "One less"} ${esc(itemName(line))}">−</button><span aria-live="polite">${line.quantity}</span><button data-action="${context}-step" data-index="${index}" data-step="1" ${line.quantity >= 99 ? "disabled" : ""} aria-label="One more ${esc(itemName(line))}">+</button></div>`;
}
function orderSummary() {
  return `<aside class="order-summary" aria-label="Order summary"><p class="eyebrow">YOUR TABLE STARTS HERE</p><h2>Your order <span>(${quantity(cart)})</span></h2>${cart.length ? `<ul>${cart.map((l) => `<li><span><b>${l.quantity} × ${esc(itemName(l))}</b><small>${esc(detail(l))}</small></span><strong>${money(unitPrice(l) * l.quantity)}</strong></li>`).join("")}</ul><a class="button primary" href="#cart"><span>Review order</span><span>${money(total(cart))}</span></a><p class="fine">Availability and final prices confirmed by Romae.</p>` : `<p class="muted">A favourite pizza, something to share.<br>Start with the menu.</p><a class="text-link" href="#build">Build your own pizza →</a>`}</aside>`;
}
function orderBar() {
  return cart.length
    ? `<a class="order-bar button primary" href="#cart"><span>View order · ${quantity(cart)} ${quantity(cart) === 1 ? "item" : "items"}</span><strong>${money(total(cart))}</strong></a>`
    : "";
}
function picture(item, extra = "") {
  return item.photo
    ? `<img class="${extra}" src="${asset(item.photo)}" alt="${esc(item.name)}" loading="lazy" width="360" height="360">`
    : `<div class="sample-art ${extra}" aria-hidden="true"><span>${esc(item.mark)}</span><small>ROMAE / PREVIEW</small></div>`;
}
function menuCard(item) {
  const defaultLine = config(item.id, 1);
  const idx = cart.findIndex((l) => lineKey(l) === lineKey(defaultLine));
  return `<article class="menu-card ${item.category === "Pizza" ? "pizza-card" : "compact-card"}"><button class="item-open" data-action="open-item" data-id="${item.id}" aria-label="${esc(item.name)}, ${money(item.price)}. See options">${picture(item)}<div class="item-copy"><span class="diet">${item.preview ? "PREVIEW ITEM" : item.veg ? "VEGETARIAN" : "CHICKEN"}</span><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p></div></button><div class="item-buy"><strong>${money(item.price)}</strong>${idx >= 0 ? stepper(cart[idx], idx, "menu") : `<button class="add-button" data-action="quick-add" data-id="${item.id}" aria-label="Add ${esc(item.name)}">+ Add</button>`}</div></article>`;
}
function renderMenu() {
  return `<main id="main" class="menu-page" tabindex="-1"><section class="menu-heading"><div><p class="eyebrow">PIZZA, THE ROMAE WAY</p><h1>Good pizza.<br>Great company.</h1><p>Pick a house favourite. Or make it your own.</p></div><a href="#build" class="studio-invite"><span>YOUR PIZZA, YOUR RULES</span><strong>Build your own <span aria-hidden="true">↗</span></strong><small>From ${money(349)} · choose your size & toppings</small><img src="assets/romae-11.webp" alt="" width="160" height="160"></a></section><div class="ordering-layout"><nav class="category-nav" aria-label="Menu sections">${categories.map((c, i) => `<button data-action="category" data-category="${c}" aria-pressed="${i === 0}">${c}</button>`).join("")}</nav><div class="catalog">${categories
    .map(
      (c) =>
        `<section id="${categoryId(c)}" class="menu-section" aria-labelledby="title-${c}"><div class="section-heading"><h2 id="title-${c}">${c === "Pizza" ? "House pizzas" : c}</h2><span>${catalog.filter((x) => x.category === c).length} choices</span></div>${c !== "Pizza" ? '<p class="preview-note">Preview menu · these sample items are not available to order yet.</p>' : ""}<div class="menu-grid ${c === "Pizza" ? "" : "compact-grid"}">${catalog
          .filter((x) => x.category === c)
          .map(menuCard)
          .join("")}</div></section>`,
    )
    .join(
      "",
    )}<footer class="menu-footer"><span class="brand">Romae</span><p>Good food. Better together.</p><a href="#help">Need a hand?</a></footer></div>${orderSummary()}</div>${orderBar()}</main>`;
}
function openItem(id) {
  const item = catalog.find((x) => x.id === id);
  sheetDraft = config(id, 1);
  $("sheet-title").textContent = item.name;
  renderSheet();
  sheet.showModal();
}
function renderSheet() {
  const active = sheet.contains(document.activeElement)
    ? document.activeElement
    : null;
  const focus = active
    ? {
        action: active.dataset.action,
        step: active.dataset.step,
        name: active.name,
        value: active.value,
      }
    : null;
  const item = catalog.find((x) => x.id === sheetDraft.productId);
  $("sheet-body").innerHTML =
    `<div class="sheet-photo">${picture(item)}</div><p class="sheet-description">${esc(item.description)}</p>${item.preview ? '<p class="notice">Preview item. You can try it in your cart, but it cannot be sent to the restaurant.</p>' : ""}${item.category === "Pizza" ? `<fieldset class="size-options"><legend>Size</legend>${sizes.map((s, i) => `<label><input type="radio" name="sheet-size" value="${i}" ${sheetDraft.size === i ? "checked" : ""}><span>${s}<small>${money(unitPrice({ ...sheetDraft, size: i }))}</small></span></label>`).join("")}</fieldset><button class="customise-link" data-action="customise"><strong>Customise this pizza</strong><span>Add or take off toppings ↗</span></button>` : ""}<div class="sheet-bottom"><div class="stepper"><button data-action="sheet-step" data-step="-1" ${sheetDraft.quantity === 1 ? "disabled" : ""} aria-label="One less">−</button><span aria-live="polite">${sheetDraft.quantity}</span><button data-action="sheet-step" data-step="1" ${sheetDraft.quantity === 99 ? "disabled" : ""} aria-label="One more">+</button></div><button class="button primary" data-action="sheet-add"><span>Add to order</span><span>${money(unitPrice(sheetDraft) * sheetDraft.quantity)}</span></button></div>`;
  if (focus) {
    const target = [...sheet.querySelectorAll("button,input")].find((e) =>
      focus.name
        ? e.name === focus.name && e.value === focus.value
        : e.dataset.action === focus.action && e.dataset.step === focus.step,
    );
    target?.focus({ preventScroll: true });
  }
}
function closeSheet() {
  sheet.close();
  sheetDraft = null;
}
$("close-sheet").onclick = closeSheet;
sheet.addEventListener("click", (e) => {
  if (e.target === sheet) {
    const b = sheet.getBoundingClientRect();
    if (
      e.clientX < b.left ||
      e.clientX > b.right ||
      e.clientY < b.top ||
      e.clientY > b.bottom
    )
      closeSheet();
  }
});
function pizzaMarkup() {
  const pieces = toppings
    .flatMap((t, ti) =>
      Array.from({ length: draft.counts[t.id] || 0 }, (_, portion) =>
        Array.from({ length: t.pieces }, (_, i) => {
          const a = i * 2.39996 + ti * 1.73 + portion * 2.2,
            r = Math.sqrt((i + 0.55) / t.pieces) * 32;
          return `<img class="ingredient" src="${asset(t.photo)}" alt="" style="left:${50 + Math.cos(a) * r}%;top:${50 + Math.sin(a) * r}%;width:${t.width}%;rotate:${a * 62}deg">`;
        }),
      ).flat(),
    )
    .join("");
  return `<div class="pizza-visual size-${draft.size}" role="img" aria-label="${esc(detail(draft))} pizza preview"><img class="pizza-base" src="assets/${previewPhase === "added" ? "romae-6.webp" : "romae-21.webp"}" alt="" width="540" height="540"><div class="ingredient-layers">${pieces}</div></div>`;
}
function renderBuilder() {
  const item = catalog.find((x) => x.id === draft.productId);
  const summary = toppings
    .filter((t) => draft.counts[t.id])
    .map((t) => `${t.name}${draft.counts[t.id] === 2 ? " ×2" : ""}`)
    .join(", ");
  return `<main id="main" class="builder-page page-shell" tabindex="-1"><div class="page-top"><a class="back-link" href="${draft.editKey ? "#cart" : "#menu"}">← ${draft.editKey ? "Back to order" : "All dishes"}</a><button class="text-button" data-action="reset-builder">Start over</button></div><div class="builder-layout"><section class="studio"><div class="studio-heading"><p class="eyebrow">THE ROMAE PIZZA STUDIO</p><h1>${esc(item?.name || "Build your pizza")}</h1><p>${draft.editKey ? "Editing your order" : "Made your way, one topping at a time."}</p></div><div id="pizza-stage" class="pizza-stage ${previewPhase === "added" ? "baked" : ""}">${pizzaMarkup()}<span class="preview-label">${previewPhase === "added" ? "Added to your order" : "Illustrative preview"}</span></div><p class="fine">The recipe description is the kitchen reference. The preview shows editable toppings.</p></section><section class="builder-controls" aria-label="Pizza options"><div class="mobile-recipe-peek">${pizzaMarkup()}<div><strong>${esc(item?.name || "Your pizza")}</strong><small>${sizes[draft.size]} · ${draft.quantity} ${draft.quantity === 1 ? "pizza" : "pizzas"}</small></div><b>${money(unitPrice(draft) * draft.quantity)}</b></div><fieldset class="size-options"><legend>Choose your size</legend>${sizes.map((s, i) => `<label><input type="radio" name="builder-size" value="${i}" ${draft.size === i ? "checked" : ""}><span>${s}<small>${money(unitPrice({ ...draft, size: i }))}</small></span></label>`).join("")}</fieldset><div class="topping-heading"><h2>Make it yours</h2><p>Up to two portions of each topping.</p></div><div class="topping-grid">${toppings
    .map((t) => {
      const n = draft.counts[t.id] || 0,
        included = item?.preset?.[t.id] || 0;
      return `<div class="topping-cell"><button class="topping-pick ${n ? "selected" : ""}" data-action="topping-add" data-id="${t.id}" aria-pressed="${n > 0}" aria-label="Add ${t.name}, ${n} of 2 portions selected, extra portion ${money(t.price)}"><img src="${asset(t.photo)}" alt="" width="44" height="44"><span>${t.name}</span><small>${included ? `First ${included} included · ` : ""}+${money(t.price)}</small><b class="portion" aria-hidden="true">${n === 2 ? "×2" : n ? "✓" : ""}</b></button>${n ? `<button class="topping-remove" data-action="topping-remove" data-id="${t.id}" aria-label="Remove one ${t.name}">−</button>` : ""}</div>`;
    })
    .join(
      "",
    )}</div><div class="recipe-summary"><h3>Your recipe</h3><p>${esc(summary || "Tomato sauce base. Choose at least one topping.")}</p>${item ? "<small>Removing an included topping does not reduce the house-pizza price.</small>" : ""}</div><div class="quantity-line"><span>How many?</span><div class="stepper"><button data-action="builder-step" data-step="-1" ${draft.quantity === 1 ? "disabled" : ""} aria-label="One less pizza">−</button><span>${draft.quantity}</span><button data-action="builder-step" data-step="1" ${draft.quantity === 99 ? "disabled" : ""} aria-label="One more pizza">+</button></div></div>${previewPhase === "added" ? `<div class="added-message" role="status">Fresh from the oven. Your pizza is in the bag.</div><a class="button primary" href="#cart"><span>View order · ${quantity(cart)} items</span><strong>${money(total(cart))}</strong></a><button class="button outline full" data-action="make-another">Make another</button>` : `<button class="button primary full" data-action="builder-save"><span>${draft.editKey ? "Save changes" : "Add to order"}</span><strong>${money(unitPrice(draft) * draft.quantity)}</strong></button><p class="fine">Saved on this device as you build.</p>`}</section></div></main>`;
}
function cartLines() {
  return `<ul class="cart-lines">${cart.map((l, i) => `<li><div class="cart-line-copy"><h2>${esc(itemName(l))}</h2><p>${esc(detail(l))}</p><strong>${money(unitPrice(l) * l.quantity)}</strong><div class="cart-line-links">${isPizza(l) ? `<button class="text-button" data-action="edit-line" data-index="${i}">Edit pizza</button>` : ""}<button class="text-button" data-action="remove-line" data-index="${i}" aria-label="Remove ${esc(itemName(l))}">Remove</button></div></div>${stepper(l, i)}</li>`).join("")}</ul>`;
}
function field(name, label, options = {}) {
  return `<label class="field" for="checkout-${name}"><span>${label}</span><input id="checkout-${name}" name="${name}" value="${esc(checkout[name])}" maxlength="${options.max || 80}" ${options.required ? "required" : ""} ${options.type ? `type="${options.type}"` : ""} ${options.autocomplete ? `autocomplete="${options.autocomplete}"` : ""} ${errors[name] ? `aria-invalid="true" aria-describedby="error-${name}"` : ""}><small id="error-${name}" class="error">${errors[name] || ""}</small></label>`;
}
function renderCart() {
  if (!cart.length)
    return `<main id="main" class="page-shell narrow empty-page" tabindex="-1"><p class="eyebrow">YOUR ORDER</p><h1>Room for a pizza?</h1><p>Your bag is empty. Find something good to share.</p><a href="#menu" class="button primary">See the menu</a></main>`;
  return `<main id="main" class="page-shell checkout-page" tabindex="-1"><a href="#menu" class="back-link">← Back to menu</a><div class="page-title"><p class="eyebrow">A LITTLE SOMETHING FOR EVERYONE</p><h1>Your order</h1></div><div class="checkout-layout"><section aria-label="Items in your order">${cartLines()}<a class="text-link" href="#menu">+ Add something else</a></section><section class="checkout-card"><form id="checkout-form" novalidate><fieldset class="fulfilment"><legend>How would you like it?</legend><label><input type="radio" name="mode" value="pickup" ${checkout.mode === "pickup" ? "checked" : ""}><span>Pick up</span></label><label><input type="radio" name="mode" value="dine-in" ${checkout.mode === "dine-in" ? "checked" : ""}><span>Dine in</span></label></fieldset>${checkout.mode === "dine-in" ? field("table", "Table number", { required: true, max: 12 }) : ""}<h2>Your details</h2>${field("name", "Name", { required: true, autocomplete: "name", max: 60 })}${field("phone", "Phone (optional)", { type: "tel", autocomplete: "tel", max: 20 })}<label class="field" for="checkout-note"><span>Note for the kitchen (optional)</span><textarea id="checkout-note" name="note" maxlength="300" rows="3">${esc(checkout.note)}</textarea></label><div class="price-total"><span>Estimated total</span><strong>${money(total(cart))}</strong></div><p class="fine">No payment is taken here. Romae confirms availability, final prices and payment arrangements.</p>${cart.some(isPreview) ? '<p class="notice">Your bag includes preview items. You can save this draft, but remove preview items before sending it to Romae.</p>' : ""}<button class="button primary full" type="submit">Review order request <span aria-hidden="true">→</span></button></form></section></div></main>`;
}
function renderReview() {
  if (!cart.length) return renderCart();
  if (Object.keys(validateCheckout(checkout)).length) {
    location.hash = "cart";
    return "";
  }
  const url = whatsappDraft(cart, checkout);
  return `<main id="main" class="page-shell narrow review-page" tabindex="-1"><a href="#cart" class="back-link">← Edit your order</a><p class="eyebrow">ONE LAST LOOK</p><h1>Ready to share?</h1><div class="review-card"><p><strong>${esc(checkout.name)}</strong><br>${checkout.mode === "dine-in" ? "Dine in · table " + esc(checkout.table) : "Pickup"}${checkout.phone ? "<br>" + esc(checkout.phone) : ""}</p><ul class="review-lines">${cart.map((l) => `<li><div><strong>${l.quantity} × ${esc(itemName(l))}</strong><small>${esc(detail(l))}</small></div><b>${money(unitPrice(l) * l.quantity)}</b></li>`).join("")}</ul>${checkout.note ? `<p><strong>Kitchen note</strong><br>${esc(checkout.note)}</p>` : ""}<div class="price-total"><span>Estimated total</span><strong>${money(total(cart))}</strong></div></div>${url ? `<a class="button primary full" id="whatsapp-handoff" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Continue on WhatsApp ↗</a><p class="fine">Review and send the message in WhatsApp. Your order is confirmed only when Romae replies. Opening WhatsApp does not submit an order here.</p>` : '<p class="notice">Preview items cannot be sent to the restaurant. Remove them in your bag to continue on WhatsApp.</p>'}<button class="button outline full" data-action="save-order-draft">Save draft on this device</button><p class="fine">Saved drafts appear in Orders. They are not restaurant-confirmed orders.</p></main>`;
}
function renderOrders() {
  return `<main id="main" class="page-shell narrow" tabindex="-1"><p class="eyebrow">SAVED FOR LATER</p><h1>Your order drafts</h1><p class="intro-copy">Drafts saved on this device. Check WhatsApp for restaurant confirmations.</p>${savedOrders.length ? savedOrders.map((o, i) => `<article class="saved-order"><div><span class="status-tag">${o.preview ? "PREVIEW DRAFT" : "UNCONFIRMED DRAFT"}</span><h2>${esc(o.name || "Your order")}</h2><p>${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(o.created)} · ${quantity(o.cart)} items</p><strong>${money(total(o.cart))}</strong></div><div class="saved-order-actions"><button class="button outline" data-action="open-saved" data-index="${i}">View draft</button><button class="text-button" data-action="delete-saved" data-index="${i}">Delete</button></div></article>`).join("") : `<div class="empty-card"><h2>No drafts on this device yet</h2><p>Build an order and save it at review to find it here.</p><a href="#menu" class="button primary">Explore the menu</a></div>`}<a href="#help" class="text-link">Need help with an order?</a></main>`;
}
function showSaved(index) {
  const o = savedOrders[index];
  if (!o) return;
  $("sheet-title").textContent = "Saved order draft";
  $("sheet-body").innerHTML =
    `<p class="notice">This draft has not been confirmed by the restaurant.</p><ul class="review-lines">${o.cart.map((l) => `<li><span>${l.quantity} × ${esc(itemName(l))}<small>${esc(detail(l))}</small></span><strong>${money(unitPrice(l) * l.quantity)}</strong></li>`).join("")}</ul><p>${esc(o.checkout.mode === "dine-in" ? "Dine in · table " + o.checkout.table : "Pickup")}<br>${esc(o.checkout.name)}</p><p>${esc(o.checkout.note || "")}</p><p class="price-total"><span>Estimated total</span><strong>${money(total(o.cart))}</strong></p><button class="button primary full" data-action="restore-saved" data-index="${index}">Add these items to your bag</button>`;
  sheet.showModal();
}
function renderAccount() {
  return `<main id="main" class="page-shell narrow" tabindex="-1"><p class="eyebrow">MAKE YOURSELF AT HOME</p><h1>Your details</h1><p class="intro-copy">Save your details on this device for next time. You can always order as a guest.</p><form id="profile-form" class="simple-card"><label class="field"><span>Name</span><input name="name" autocomplete="name" maxlength="60" value="${esc(profile.name)}"></label><label class="field"><span>Phone (optional)</span><input name="phone" type="tel" autocomplete="tel" maxlength="20" value="${esc(profile.phone)}"></label><button class="button primary" type="submit">Save details</button><p class="fine">Stored only in this browser. This does not create an online account or sync across devices.</p></form><a class="destination-link" href="#orders"><strong>Your drafts</strong><span>Orders saved on this device →</span></a><a class="destination-link" href="#help"><strong>Need a hand?</strong><span>Ask Romae about your order →</span></a></main>`;
}
function renderHelp() {
  const topics = ["Payment or price", "Allergy or reaction", "Something else"];
  return `<main id="main" class="page-shell narrow" tabindex="-1"><p class="eyebrow">WE’RE HERE TO HELP</p><h1>${esc(supportDraft.topic || "How can we help?")}</h1>${supportDraft.topic ? `<button class="text-button" data-action="help-back">← Back to help topics</button>${supportDraft.topic === "Allergy or reaction" ? '<p class="notice">If someone is having a serious reaction, call your local emergency number now.</p>' : ""}<form id="help-form" class="simple-card"><label class="field"><span>Tell Romae what happened</span><textarea id="help-message" name="message" required maxlength="1200" rows="6">${esc(supportDraft.message)}</textarea></label><button class="button primary" type="submit">Prepare WhatsApp message ↗</button><p class="fine">You review and send the message in WhatsApp. Nothing is sent automatically.</p></form>` : `<p class="intro-copy">For an existing order, include your name and when you ordered.</p><div class="help-topics">${topics.map((t) => `<button class="destination-link" data-action="help-topic" data-topic="${t}"><strong>${t}</strong><span aria-hidden="true">→</span></button>`).join("")}</div>`}</main>`;
}
function routeName() {
  const hash = location.hash.slice(1).split("?")[0];
  return [
    "menu",
    "build",
    "cart",
    "review",
    "orders",
    "account",
    "help",
  ].includes(hash)
    ? hash
    : "menu";
}
function render({ preserveScroll = false, focus = false } = {}) {
  const y = scrollY;
  observer?.disconnect();
  const route = routeName();
  currentRoute = route;
  document.body.dataset.route = route;
  document.title =
    {
      menu: "Menu",
      build: "Pizza studio",
      cart: "Your order",
      review: "Review order",
      orders: "Order drafts",
      account: "Your details",
      help: "Help",
    }[route] + " · Romae";
  document.querySelectorAll(".header nav a").forEach((a) => {
    if (a.hash === "#" + route) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  app.innerHTML = {
    menu: renderMenu,
    build: renderBuilder,
    cart: renderCart,
    review: renderReview,
    orders: renderOrders,
    account: renderAccount,
    help: renderHelp,
  }[route]();
  updateHeader();
  if (route === "menu") observeCategories();
  if (preserveScroll) scrollTo({ top: y, behavior: "instant" });
  if (focus) $("main")?.focus({ preventScroll: true });
}
function observeCategories() {
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      const category = visible[0].target.id.replace("category-", "");
      document
        .querySelectorAll('[data-action="category"]')
        .forEach((b) =>
          b.setAttribute(
            "aria-pressed",
            b.dataset.category.toLowerCase() === category,
          ),
        );
    },
    { rootMargin: "-150px 0px -45% 0px", threshold: 0 },
  );
  document
    .querySelectorAll(".menu-section")
    .forEach((s) => observer.observe(s));
}
function changeCart(index, step) {
  const line = cart[index];
  if (!line) return;
  if (line.quantity + step <= 0) {
    removeLine(index);
    return;
  }
  line.quantity = Math.min(99, line.quantity + step);
  persistCart();
  refresh();
}
function removeLine(index) {
  const removed = cart.splice(index, 1)[0];
  if (!removed) return;
  persistCart();
  refresh();
  toast(itemName(removed) + " removed", () => {
    addLine(cart, removed);
    persistCart();
    refresh();
  });
}
function refresh() {
  const focused = document.activeElement;
  const action = focused?.dataset?.action,
    index = focused?.dataset?.index,
    id = focused?.dataset?.id,
    step = focused?.dataset?.step;
  render({ preserveScroll: true });
  if (action) {
    const match = [...app.querySelectorAll("[data-action]")].find(
      (e) =>
        e.dataset.action === action &&
        e.dataset.index === index &&
        e.dataset.id === id &&
        e.dataset.step === step,
    );
    match?.focus({ preventScroll: true });
  }
}
function startBuilder(line, editKey = null) {
  draft = { ...clone(line), editKey };
  previewPhase = "editing";
  persistBuilder();
  if (location.hash === "#build") render({ focus: true });
  else location.hash = "build";
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const a = button.dataset.action,
    id = button.dataset.id,
    index = Number(button.dataset.index),
    step = Number(button.dataset.step);
  if (a === "category") {
    document
      .getElementById(categoryId(button.dataset.category))
      ?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    return;
  }
  if (a === "open-item") {
    openItem(id);
    return;
  }
  if (a === "quick-add") {
    addLine(cart, config(id, 1));
    persistCart();
    refresh();
    toast(catalog.find((x) => x.id === id).name + " added");
    return;
  }
  if (a === "menu-step" || a === "cart-step") {
    changeCart(index, step);
    return;
  }
  if (a === "sheet-step") {
    sheetDraft.quantity = Math.max(1, Math.min(99, sheetDraft.quantity + step));
    renderSheet();
    return;
  }
  if (a === "sheet-add") {
    const line = clone(sheetDraft);
    addLine(cart, line);
    persistCart();
    closeSheet();
    refresh();
    toast(itemName(line) + " added");
    return;
  }
  if (a === "customise") {
    const line = clone(sheetDraft);
    closeSheet();
    startBuilder(line);
    return;
  }
  if (a === "edit-line") {
    startBuilder(cart[index], lineKey(cart[index]));
    return;
  }
  if (a === "remove-line") {
    removeLine(index);
    return;
  }
  if (a === "builder-step") {
    draft.quantity = Math.max(1, Math.min(99, draft.quantity + step));
    previewPhase = "editing";
    persistBuilder();
    refresh();
    return;
  }
  if (a === "topping-add" || a === "topping-remove") {
    if (a === "topping-add" && draft.counts[id] === 2) {
      toast("Two portions is the most for this topping.");
      return;
    }
    draft.counts[id] = Math.max(
      0,
      Math.min(2, (draft.counts[id] || 0) + (a === "topping-add" ? 1 : -1)),
    );
    previewPhase = "editing";
    persistBuilder();
    refresh();
    return;
  }
  if (a === "reset-builder") {
    const old = clone(draft);
    draft = {
      ...config(draft.productId, draft.size, undefined, draft.quantity),
      editKey: draft.editKey,
    };
    previewPhase = "editing";
    persistBuilder();
    refresh();
    toast("Recipe reset", () => {
      draft = old;
      persistBuilder();
      refresh();
    });
    return;
  }
  if (a === "builder-save") {
    if (!Object.values(draft.counts).some(Boolean)) {
      toast("Add at least one topping first.");
      return;
    }
    const line = config(
      draft.productId,
      draft.size,
      draft.counts,
      draft.quantity,
    );
    if (draft.editKey) {
      const i = cart.findIndex((l) => lineKey(l) === draft.editKey);
      if (i < 0) {
        toast("This item is no longer in your bag. Add it as a new pizza.");
        draft.editKey = null;
        persistBuilder();
        refresh();
        return;
      }
      editLine(cart, i, line);
    } else addLine(cart, line);
    draft.editKey = null;
    persistBuilder();
    persistCart();
    previewPhase = "added";
    refresh();
    toast("Your pizza is in the bag.");
    return;
  }
  if (a === "make-another") {
    draft = config();
    previewPhase = "editing";
    persistBuilder();
    refresh();
    return;
  }
  if (a === "save-order-draft") {
    if (!cart.length) return;
    const fingerprint = JSON.stringify({ cart, checkout });
    let existing = savedOrders.find((o) => o.fingerprint === fingerprint);
    if (!existing) {
      savedOrders.unshift({
        id: crypto.randomUUID(),
        created: Date.now(),
        name: checkout.name,
        checkout: clone(checkout),
        cart: clone(cart),
        preview: cart.some(isPreview),
        fingerprint,
      });
      savedOrders = savedOrders.slice(0, 50);
      write("orders", savedOrders);
    }
    toast("Draft saved. This is not a confirmed order.");
    location.hash = "orders";
    return;
  }
  if (a === "open-saved") {
    showSaved(index);
    return;
  }
  if (a === "delete-saved") {
    const removed = savedOrders.splice(index, 1)[0];
    write("orders", savedOrders);
    refresh();
    toast("Draft deleted", () => {
      savedOrders.splice(index, 0, removed);
      write("orders", savedOrders);
      refresh();
    });
    return;
  }
  if (a === "restore-saved") {
    for (const l of savedOrders[index].cart) addLine(cart, clone(l));
    persistCart();
    closeSheet();
    location.hash = "cart";
    toast("Saved items added to your bag.");
    return;
  }
  if (a === "help-topic") {
    supportDraft.topic = button.dataset.topic;
    write("support", supportDraft);
    render({ focus: true });
    return;
  }
  if (a === "help-back") {
    supportDraft.topic = "";
    write("support", supportDraft);
    render({ focus: true });
    return;
  }
});
document.addEventListener("change", (event) => {
  if (event.target.name === "sheet-size" && sheetDraft) {
    sheetDraft.size = Number(event.target.value);
    renderSheet();
  }
  if (event.target.name === "builder-size") {
    draft.size = Number(event.target.value);
    previewPhase = "editing";
    persistBuilder();
    refresh();
  }
  if (event.target.name === "mode") {
    checkout.mode = event.target.value;
    errors = {};
    write("checkout", checkout);
    refresh();
  }
});
document.addEventListener("input", (event) => {
  if (event.target.closest("#checkout-form")) {
    checkout[event.target.name] = event.target.value;
    write("checkout", checkout);
    if (errors[event.target.name]) {
      delete errors[event.target.name];
      event.target.removeAttribute("aria-invalid");
      const error = $("error-" + event.target.name);
      if (error) error.textContent = "";
    }
  }
  if (event.target.id === "help-message") {
    supportDraft.message = event.target.value;
    write("support", supportDraft);
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id === "checkout-form") {
    event.preventDefault();
    errors = validateCheckout(checkout);
    if (Object.keys(errors).length) {
      render({ preserveScroll: true });
      $("checkout-" + Object.keys(errors)[0])?.focus();
      return;
    }
    write("checkout", checkout);
    location.hash = "review";
  }
  if (event.target.id === "profile-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    const phone = String(data.get("phone") || "");
    if (validateCheckout({ name: "Profile", phone }).phone) {
      event.target.elements.phone.setCustomValidity(
        "Use a valid phone number.",
      );
      event.target.elements.phone.reportValidity();
      event.target.elements.phone.oninput = () =>
        event.target.elements.phone.setCustomValidity("");
      return;
    }
    profile = { name: String(data.get("name") || "").trim(), phone };
    write("profile", profile);
    checkout.name = profile.name;
    checkout.phone = profile.phone;
    write("checkout", checkout);
    toast("Details saved on this device.");
  }
  if (event.target.id === "help-form") {
    event.preventDefault();
    const message = supportDraft.message.trim();
    if (!message) {
      event.target.elements.message.setCustomValidity(
        "Please describe what happened.",
      );
      event.target.elements.message.reportValidity();
      event.target.elements.message.oninput = () =>
        event.target.elements.message.setCustomValidity("");
      return;
    }
    const text = `Hi Romae, I need help with: ${supportDraft.topic}\n${message}`;
    $("sheet-title").textContent = "Review your message";
    $("sheet-body").innerHTML =
      `<p class="message-preview">${esc(text)}</p><a class="button primary full" href="https://wa.me/918446844925?text=${encodeURIComponent(text)}" target="_blank" rel="noopener noreferrer">Continue on WhatsApp ↗</a><p class="fine">You choose whether to send. Romae has not received this message yet.</p>`;
    sheet.showModal();
  }
});
addEventListener("hashchange", () => {
  if (sheet.open) closeSheet();
  if (currentRoute === "menu") menuScroll = scrollY;
  render({ focus: true });
  scrollTo({
    top: routeName() === "menu" ? menuScroll : 0,
    behavior: "instant",
  });
});
addEventListener("storage", (event) => {
  if (event.key === "romae.v2.cart") {
    cart = [];
    for (const l of read("cart", [])) {
      try {
        addLine(cart, l);
      } catch {}
    }
    if (sheet.open) closeSheet();
    refresh();
    toast("Your bag was updated in another tab.");
  }
});
render();
