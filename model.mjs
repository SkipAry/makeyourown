export const sizes = ["Small", "Medium", "Large"];
export const toppings = [
  {
    id: "mozzarella",
    name: "Mozzarella",
    price: 60,
    photo: "romae-12.webp",
    pieces: 8,
    width: 15,
  },
  {
    id: "pepperoni",
    name: "Chicken pepperoni",
    price: 90,
    photo: "romae-18.webp",
    pieces: 7,
    width: 15,
  },
  {
    id: "mushroom",
    name: "Mushrooms",
    price: 55,
    photo: "romae-13.webp",
    pieces: 7,
    width: 17,
  },
  {
    id: "olive",
    name: "Black olives",
    price: 50,
    photo: "romae-14.webp",
    pieces: 9,
    width: 10,
  },
  {
    id: "basil",
    name: "Basil",
    price: 30,
    photo: "romae-7.webp",
    pieces: 5,
    width: 17,
  },
  {
    id: "onion",
    name: "Red onion",
    price: 40,
    photo: "romae-15.webp",
    pieces: 7,
    width: 13,
  },
  {
    id: "peppers",
    name: "Peppers",
    price: 45,
    photo: "romae-19.webp",
    pieces: 6,
    width: 16,
  },
  {
    id: "tomato",
    name: "Tomato",
    price: 40,
    photo: "romae-23.webp",
    pieces: 6,
    width: 15,
  },
];
export const catalog = [
  {
    id: "margherita",
    name: "Margherita",
    category: "Pizza",
    description: "Tomato pelati, bocconcini and basil.",
    price: 585,
    photo: "romae-11.webp",
    veg: true,
    preset: { mozzarella: 1, basil: 1 },
  },
  {
    id: "diavola",
    name: "Pepperoni Chicken",
    category: "Pizza",
    description: "Chicken pepperoni, tomato pelati, fior di latte and basil.",
    price: 745,
    photo: "romae-9.webp",
    veg: false,
    preset: { mozzarella: 1, pepperoni: 1, basil: 1 },
  },
  {
    id: "mediterranean",
    name: "Mediterranean Pesto",
    category: "Pizza",
    description: "Basil pesto, bocconcini, sun-dried tomatoes and olives.",
    price: 775,
    photo: "romae-20.webp",
    veg: true,
    preset: { mozzarella: 1, basil: 1, tomato: 1, olive: 1 },
  },
  {
    id: "paneer",
    name: "Peri Peri Paneer",
    category: "Pizza",
    description: "Paneer, ricotta, fior di latte and pickled paprika.",
    price: 695,
    photo: "romae-17.webp",
    veg: true,
    preset: { mozzarella: 1, peppers: 1 },
  },
  {
    id: "white-forest",
    name: "White Forest & Truffle",
    category: "Pizza",
    description: "Mushrooms, ricotta, burrata, parsley and truffle oil.",
    price: 975,
    photo: "romae-24.webp",
    veg: true,
    preset: { mozzarella: 1, mushroom: 1 },
  },
  {
    id: "smoked-chicken",
    name: "Smoked Chicken",
    category: "Pizza",
    description: "Smoked chicken, tomato pelati, fior di latte and peppers.",
    price: 915,
    photo: "romae-22.webp",
    veg: false,
    preset: { mozzarella: 1, peppers: 1 },
  },
  {
    id: "garlic-knots",
    name: "Garlic knots",
    category: "Sides",
    description:
      "Garlic butter and parsley. Sample item for trying the ordering flow.",
    price: 180,
    preview: true,
    mark: "Knots",
  },
  {
    id: "burrata-salad",
    name: "Burrata salad",
    category: "Sides",
    description: "Burrata, tomatoes and basil. Sample item.",
    price: 320,
    preview: true,
    mark: "Salad",
  },
  {
    id: "lemonade",
    name: "Fresh lemonade",
    category: "Drinks",
    description: "Lemon and mint. Sample item.",
    price: 120,
    preview: true,
    mark: "Lemon",
  },
  {
    id: "cola",
    name: "Cola",
    category: "Drinks",
    description: "330 ml. Sample item.",
    price: 80,
    preview: true,
    mark: "Cola",
  },
  {
    id: "water",
    name: "Sparkling water",
    category: "Drinks",
    description: "500 ml. Sample item.",
    price: 100,
    preview: true,
    mark: "Water",
  },
  {
    id: "tiramisu",
    name: "Tiramisu",
    category: "Desserts",
    description: "Coffee, mascarpone and cocoa. Sample item.",
    price: 250,
    preview: true,
    mark: "Dolce",
  },
];
export const categories = ["Pizza", "Sides", "Drinks", "Desserts"];
export const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function countsOf(value = {}) {
  return Object.fromEntries(
    toppings.map((t) => [
      t.id,
      Math.max(0, Math.min(2, Math.floor(Number(value[t.id]) || 0))),
    ]),
  );
}
export function config(productId = "custom", size = 1, counts, quantity = 1) {
  const item = catalog.find((x) => x.id === productId);
  if (!item && productId !== "custom") throw new Error("Unknown item");
  return {
    productId,
    size: Math.max(0, Math.min(2, Math.floor(Number(size) || 0))),
    counts: countsOf(counts ?? item?.preset),
    quantity: Math.max(1, Math.min(99, Math.floor(Number(quantity) || 1))),
  };
}
export function unitPrice(line) {
  const item = catalog.find((x) => x.id === line.productId);
  if (item && item.category !== "Pizza") return item.price;
  const base = item
    ? item.price + (line.size - 1) * 100
    : [349, 449, 549][line.size];
  return (
    base +
    toppings.reduce(
      (sum, t) =>
        sum +
        t.price *
          Math.max(0, (line.counts[t.id] || 0) - (item?.preset?.[t.id] || 0)),
      0,
    )
  );
}
export function lineKey(line) {
  const item = catalog.find((x) => x.id === line.productId);
  return item && item.category !== "Pizza"
    ? item.id
    : [
        line.productId,
        line.size,
        ...toppings.map((t) => line.counts[t.id] || 0),
      ].join(":");
}
export function addLine(cart, line) {
  const clean = config(line.productId, line.size, line.counts, line.quantity);
  const existing = cart.find((x) => lineKey(x) === lineKey(clean));
  if (existing)
    existing.quantity = Math.min(99, existing.quantity + clean.quantity);
  else cart.push(clean);
  return cart;
}
export function editLine(cart, index, line) {
  if (!Number.isInteger(index) || !cart[index])
    throw new Error("Item no longer in your order");
  const clean = config(line.productId, line.size, line.counts, line.quantity);
  cart.splice(index, 1);
  return addLine(cart, clean);
}
export const total = (cart) =>
  cart.reduce((sum, line) => sum + unitPrice(line) * line.quantity, 0);
export const quantity = (cart) =>
  cart.reduce((sum, line) => sum + line.quantity, 0);
export const itemName = (line) =>
  catalog.find((x) => x.id === line.productId)?.name ?? "Your Romae pizza";
export const isPizza = (line) =>
  line.productId === "custom" ||
  catalog.find((x) => x.id === line.productId)?.category === "Pizza";
export const isPreview = (line) =>
  Boolean(catalog.find((x) => x.id === line.productId)?.preview);
export function detail(line) {
  if (!isPizza(line)) return isPreview(line) ? "Preview item" : "";
  const preset = catalog.find((x) => x.id === line.productId)?.preset ?? {};
  const bits = [sizes[line.size]];
  for (const t of toppings) {
    const count = line.counts[t.id] || 0,
      original = preset[t.id] || 0;
    if (line.productId === "custom" && count)
      bits.push(t.name + (count === 2 ? " ×2" : ""));
    else if (count > original)
      bits.push("Extra " + t.name + (count - original === 2 ? " ×2" : ""));
    else if (count < original) bits.push("Without " + t.name);
  }
  return bits.join(" · ");
}
export function validateCheckout(draft) {
  const errors = {};
  if (!String(draft.name || "").trim()) errors.name = "Please add your name.";
  if (draft.mode === "dine-in" && !String(draft.table || "").trim())
    errors.table = "Which table are you at?";
  if (
    draft.phone &&
    (!/^[+\d\s()-]{7,20}$/.test(draft.phone) ||
      String(draft.phone).replace(/\D/g, "").length < 7)
  )
    errors.phone = "Please use a phone number with at least 7 digits.";
  return errors;
}
export function whatsappDraft(cart, draft) {
  if (
    !cart.length ||
    cart.some(isPreview) ||
    Object.keys(validateCheckout(draft)).length
  )
    return null;
  const text = [
    "Hi Romae Pizzeria, please confirm this order request:",
    ...cart.map(
      (l) =>
        `${l.quantity} × ${itemName(l)} (${detail(l)}) — ${money(unitPrice(l) * l.quantity)}`,
    ),
    "",
    `Estimated total: ${money(total(cart))}`,
    `Name: ${draft.name.trim()}`,
    draft.mode === "dine-in" ? `Dine in — table ${draft.table}` : "Pickup",
    draft.phone ? `Phone: ${draft.phone}` : "",
    draft.note ? `Kitchen note: ${draft.note}` : "",
    "Please confirm availability, final price and timing.",
  ]
    .filter(Boolean)
    .join("\n");
  return "https://wa.me/918446844925?text=" + encodeURIComponent(text);
}
