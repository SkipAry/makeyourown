# Carte Pizza: interaction audit and Romae build brief

Reference: https://carte.brainy.ink/pizza

Reviewed 26 November 2026 through live browser interactions at mobile and desktop sizes.

## Coverage and limits

Tested all 14 menu-item detail sheets and quick-add buttons, all 14 menu and cart quantity stepper pairs, all three sizes for each of the five house pizzas, all eight builder toppings, removal, maximum portions, reset, zero-topping validation, bake feedback, Make another and View order. Inspected navigation, empty cart/orders, account, checkout sign-in dialog, fulfilment options, validation and all three public help categories.

No real order, email code or support message was sent. Empty checkout submission was tested with outbound non-GET requests blocked; validation stopped it locally without a request. Successful authentication, code verification, populated order history, tracking, cancellation, refunds/credit, saved addresses and real order/payment processing are **unverified**. Account copy mentions some of these capabilities; that is not proof of their behaviour.

Mouse and emulated-touch swipe attempts did not remove a cart row in this session. Minus-to-zero removal and Undo worked. Verify swipe on real mobile hardware before claiming parity. The external Carte marketing link is outside the restaurant-app scope.

## Product structure

This is a restaurant ordering app whose starting point is the menu. It is not primarily a promotional landing page. Customers can quick-add items, open detail sheets, customise a house pizza or build one from scratch. The cart leads to guest pickup/dine-in checkout. Orders, account and help are separate destinations.

Desktop has category navigation on the left, menu content in the centre and a persistent order summary on the right. Mobile has compact navigation, horizontal category controls and an order shortcut. The builder is a focused screen with back, reset and cart controls.

| Route                              | Purpose                   | Observed states                                           |
| ---------------------------------- | ------------------------- | --------------------------------------------------------- |
| `/pizza`                           | Menu and item sheets      | Empty/populated cart, category navigation                 |
| `/pizza/build/pizza`               | Custom builder            | Empty, selected, maximum, reset, baked                    |
| `/pizza/build/pizza?item=…&size=L` | House-pizza customisation | All five recipes and size handoff                         |
| `/pizza/cart`                      | Cart and checkout         | Empty, populated, pickup, dine-in, errors, sign-in dialog |
| `/pizza/orders`                    | Device order history      | Empty only                                                |
| `/pizza/account`                   | Passwordless sign-in      | Email validity gating only                                |
| `/pizza/help`                      | Support categories/forms  | All three public categories; drafts only                  |

## Menu and detail sheets

Four category buttons **scroll** to sections and update active styling; they do not filter other categories out. Sides/drinks use compact rows; pizza uses larger photographic cards plus a build-your-own entry.

| Category | Items and default prices                                                                        |
| -------- | ----------------------------------------------------------------------------------------------- |
| Sides    | Garlic knots $6; Burrata salad $9                                                               |
| Pizza    | Build from $11; Margherita $12; Diavola $15; Funghi $14; Ortolana $14; Quattro formaggi $16     |
| Drinks   | Cola $3; Cola zero $3; Orange soda $3; Sparkling water $3.50; Fresh lemonade $4.50; Espresso $3 |
| Desserts | Tiramisu $7.50                                                                                  |

Prices describe the reference. They must not replace Romae business prices/currency without instruction.

| Control                    | Observed response                                          |
| -------------------------- | ---------------------------------------------------------- |
| Item row/card              | Opens dialog with photo, description, quantity and add CTA |
| Separate item plus         | Immediately adds default item; pizza defaults to medium    |
| Existing menu quantity +/− | Updates the shared cart immediately                        |
| Close / Escape             | Closes detail sheet                                        |
| Sheet quantity +           | Increments and multiplies add price                        |
| Sheet quantity −           | Decrements; disabled at one                                |
| Add to order               | Adds configured quantity and closes sheet                  |
| Your order / View order    | Opens cart                                                 |

All 14 simple/default additions totalled **$113.50**. Adding two large Margheritas produced a separate $30 line and a **$143.50** cart. Medium and large variants remained separate.

All nine non-pizza sheets were tested at quantities one and two and back to one. All five pizza sheets were tested at all three sizes. Escape closed the sheets.

## House pizzas

| Pizza            | Small | Medium | Large | Builder preset                                 |
| ---------------- | ----- | ------ | ----- | ---------------------------------------------- |
| Margherita       | $9    | $12    | $15   | Mozzarella, basil                              |
| Diavola          | $12   | $15    | $18   | Mozzarella, pepperoni                          |
| Funghi           | $11   | $14    | $17   | Mozzarella, mushroom                           |
| Ortolana         | $11   | $14    | $17   | Mozzarella, olives, peppers, red onion, tomato |
| Quattro formaggi | $13   | $16    | $19   | Mozzarella ×2                                  |

Size options are radios. Customise carries selected size into the builder. The quantity selected in the detail sheet was **not carried through** to customisation: a two-unit draft became a one-unit builder flow. Our version should preserve it.

Quattro formaggi's description names several cheeses, but its preview model uses mozzarella ×2. Distinguish actual kitchen ingredients from simplified preview graphics.

## Builder behaviour

- Header: All dishes, restaurant mark, Start over, cart/count.
- S/M/L changes preview scale and price. Plain custom bases settled at $11/$14/$17.
- Eight toppings: mozzarella, pepperoni, mushroom, olives, basil, peppers, red onion, tomato.
- Tap adds a portion and ingredients to the preview. One portion uses a checkmark; two uses ×2.
- Maximum two portions per topping. Further taps show “Two portions is the most” without increasing the settled price.
- Remove-one controls appear for selected toppings and disappear at zero.
- Price animates with a temporary delta. Intermediate numbers are animation frames, not final prices.
- Observed extra portions: mozzarella $2.60; pepperoni $2.40; mushroom $1.80; olives $1.50; basil $1.20; peppers $1.50; red onion $1.20; tomato $1.80. Do not assume universal applicability across every recipe without further pricing tests.
- Start over resets the draft and instructional prompt, not the cart.
- With no toppings, Add to order shows “Add a topping first” and does not add an item.
- Valid add updates cart and runs “In the oven” → “Added to your order” → “Fresh from the oven”.
- Final View order button shows **whole-cart** quantity/total and opens checkout.
- Make another starts a fresh draft while retaining cart contents.
- Reloading discarded uncommitted topping selections in the tested session.

### Caveats worth fixing

After reset, unselected chips retained checkmark text in the accessibility tree although visible screenshots showed no checkmarks. Selection was not exposed with `aria-pressed` in the inspected markup. Use explicit accessible portion state; do not infer selection from raw innerText alone.

After reset, chip styling and price cleared but a captured pizza preview still showed cheese. Treat this as a visual-state discrepancy to regression-test, not behaviour to copy.

An empty “Where it goes” toolbar existed, but no usable half-pizza controls appeared. Long press did not reveal one. Half-and-half behaviour remains unverified.

## Cart and checkout

| Action/state         | Observed behaviour                                      |
| -------------------- | ------------------------------------------------------- |
| Empty                | “Nothing here yet” and See the menu                     |
| Item line            | Name, size/custom toppings, extended price and quantity |
| + / − above one      | Quantity and totals update immediately                  |
| − at one             | Removes item and offers Undo                            |
| Undo                 | Restores removed line                                   |
| Reload               | Cart survives                                           |
| Pick up              | Name, optional phone, optional kitchen note             |
| Dine in              | Table number; optional phone starts collapsed           |
| Add a phone number   | Expands phone field                                     |
| Empty pickup submit  | “Please add your name”                                  |
| Empty dine-in submit | “Which table are you at?”                               |
| Payment              | Pay at the counter; no other payment control observed   |
| Sign in              | Email-code dialog within checkout                       |
| Escape in sign-in    | Dismisses dialog                                        |
| Actual order submit  | Not executed                                            |

The cart survived refresh but **fulfilment mode, table, name and kitchen note did not**. Preserve these drafts in our version.

Guest form validation is custom; inspected fields did not have native `required` attributes. Provide associated labels, inline errors, first-error focus, `aria-invalid`, autocomplete and input modes.

No cart-line edit/customise control was exposed. Let customers edit a pizza without deleting and rebuilding it.

## Orders, account and help

Orders empty state says orders placed on this phone appear here and links to menu/help. No populated history or tracking state was available without placing an order.

Account describes a six-digit email code and guest checkout. Email me a code is disabled for empty/invalid email and enabled for valid-shaped input. Sending/verification were not executed.

Help categories: Payment or price; Allergy or reaction; Something else. Each opens a text form. Send is disabled when empty and enabled after typing. Allergy adds urgent-reaction guidance. No message was sent.

The help-form back button is named “Back to the menu” but returns to help topics at the same help route. Use “Back to help topics”.

## Improvements for Romae

1. Preserve builder draft, sheet quantity, fulfilment selection and checkout fields across refresh/back navigation.
2. Show topping surcharges **before** selection. Keep the payable total clear while optional price deltas animate.
3. Carry size and quantity through Customise; support editing configured cart lines.
4. Provide explicit Remove alongside optional swipe, with accessible Undo.
5. Show size names and business-provided diameter/portion guidance; do not invent dimensions.
6. Keep **Oswald throughout**, as requested. Retain Romae's cream/burgundy/coral visual system unless asked otherwise.
7. Expose selected portions and a concise recipe summary accessibly; do not rely on checkmarks/animation alone.
8. Respect reduced motion. Oven animation is feedback, not a prerequisite to checkout.
9. Preserve category and scroll when returning to menu.
10. Prevent duplicate submissions and show actual server-confirmed order status. Clearly distinguish local demo, WhatsApp draft and a real restaurant order.

Useful later additions: business-supplied dietary/allergen data, item-specific notes, clear price breakdowns, recoverable offline/failure states and cross-device history after authentication.

## Gap in the current Romae app

Current Romae has a marketing hero, a topping builder, pizza-only menu, bag, local demo history, preferences and a WhatsApp draft handoff. It is **not yet equivalent** to the reference.

Missing: sides/drinks/desserts categories; sized item sheets; house recipe customisation; dedicated route screens; real pickup/dine-in checkout with table; email-code authentication; backend order storage/status; support flow; desktop order summary. A local demo receipt or WhatsApp draft is not a kitchen-confirmed order.

## Build sequence and acceptance criteria

1. **Menu/cart foundation:** structured business catalog, category scroll navigation, detail sheets, quick add, quantity controls, variant identity and shared cart. Menu, sheet, summary and checkout must agree.
2. **Builder parity:** house presets, size/quantity handoff, portions, preview, visible surcharges, reset, empty-recipe guard, persistent drafts and cart editing. Preview, summary and settled price must agree after every action.
3. **Checkout:** pickup/dine-in, table, notes, guest validation, review, draft persistence, pending/error states. Invalid submissions must not create orders.
4. **Real ordering:** restaurant endpoint, authoritative prices/availability, idempotent creation and stored order status. Requires business integration details; do not simulate live success.
5. **Account/help:** email-code service, guest association, cross-device history and support delivery. Requires configured services and test access; do not use third-party private APIs or credentials.
6. **QA/release:** 320/375/390/430/768/1440px, keyboard/touch, reduced motion, persistence, offline/rejection, pricing, variants, repeated taps, undo and duplicate-submission protection. Use a staging restaurant to verify post-order states.

Behaviour parity is the target. Use original implementation and Romae-owned content/assets. Do not claim 100% parity until authenticated and post-order states have also been verified.
