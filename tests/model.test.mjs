import test from "node:test";
import assert from "node:assert/strict";
import {
  config,
  unitPrice,
  addLine,
  editLine,
  lineKey,
  total,
  validateCheckout,
  whatsappDraft,
  esc,
} from "../model.mjs";

test("house recipe includes its normal toppings; only additional portions cost extra", () => {
  const pizza = config("margherita");
  assert.equal(unitPrice(pizza), 585);
  pizza.counts.mozzarella = 2;
  assert.equal(unitPrice(pizza), 645);
  pizza.counts.basil = 0;
  assert.equal(unitPrice(pizza), 645);
  pizza.size = 2;
  assert.equal(unitPrice(pizza), 745);
});
test("custom pizzas charge for every portion and clamp invalid configuration", () => {
  const pizza = config("custom", 1, { mozzarella: 9, basil: -1 }, 2);
  assert.equal(pizza.counts.mozzarella, 2);
  assert.equal(pizza.counts.basil, 0);
  assert.equal(unitPrice(pizza), 569);
  assert.equal(total([pizza]), 1138);
  assert.throws(() => config("unknown"));
});
test("cart merges equal configurations but separates size and topping changes", () => {
  const cart = [];
  addLine(cart, config("margherita", 1, undefined, 2));
  addLine(cart, config("margherita", 1));
  addLine(cart, config("margherita", 2));
  addLine(cart, config("margherita", 1, { mozzarella: 2, basil: 1 }));
  assert.equal(cart.length, 3);
  assert.equal(cart[0].quantity, 3);
  assert.notEqual(lineKey(cart[0]), lineKey(cart[1]));
  assert.equal(total(cart), 585 * 3 + 685 + 645);
});
test("editing replaces one variant and merges with an identical existing line", () => {
  const cart = [config("margherita", 1), config("margherita", 2)];
  editLine(cart, 0, config("margherita", 2, undefined, 2));
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 3);
  assert.throws(() => editLine(cart, 2, config()));
});
test("checkout validation differs for pickup and dine-in", () => {
  assert.ok(validateCheckout({ mode: "pickup", name: " " }).name);
  assert.ok(validateCheckout({ mode: "dine-in", name: "A" }).table);
  assert.ok(
    validateCheckout({ mode: "pickup", name: "A", phone: "bad" }).phone,
  );
  assert.deepEqual(
    validateCheckout({
      mode: "dine-in",
      name: "A",
      table: "12",
      phone: "+91 98765 43210",
    }),
    {},
  );
});
test("preview items and invalid checkout cannot generate restaurant handoffs", () => {
  const guest = { mode: "pickup", name: "A" };
  assert.equal(whatsappDraft([config("cola")], guest), null);
  assert.equal(whatsappDraft([], guest), null);
  assert.equal(whatsappDraft([config("margherita")], { name: "" }), null);
  const url = whatsappDraft([config("margherita", 2, undefined, 2)], {
    ...guest,
    note: "No chilli & extra care",
  });
  const text = new URL(url).searchParams.get("text");
  assert.match(text, /2 × Margherita/);
  assert.match(text, /Large/);
  assert.match(text, /No chilli & extra care/);
  assert.match(text, /Please confirm availability/);
});
test("user text is escaped before insertion into HTML", () => {
  assert.equal(
    esc('<img src=x onerror="bad"> &'),
    "&lt;img src=x onerror=&quot;bad&quot;&gt; &amp;",
  );
});
