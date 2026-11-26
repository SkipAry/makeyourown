# Ordering-flow implementation validation

26 November 2026.

## Automated checks

`node --test tests/model.test.mjs`: seven passing tests covering house-pizza inclusion/surcharges, custom pricing, variant identity/merging, editing, fulfilment validation, preview-item handoff blocking, message encoding and HTML escaping.

`node --check app.mjs` and `node --check model.mjs`: passed.

## Live browser checks

- All twelve item option sheets opened, quantity incremented, and configured items added.
- All four category controls exercised.
- Large size and quantity two carried from a pizza sheet into the builder.
- Added topping survived a full reload.
- Adding a configured pizza and editing it updated the existing cart line rather than duplicating it.
- Toppings cap at two portions; remove and reset reflect the correct selection. Reset offers Undo.
- Empty checkout shows an associated name error. Dine-in requires a table number.
- Fulfilment choice, table, name, optional phone and kitchen note survived reload.
- WhatsApp URL contained configuration, quantity, estimated price, guest details, fulfilment and note.
- A script-shaped kitchen note rendered as text and did not execute.
- Preview catalog items blocked the WhatsApp order link.
- Draft save/view, local profile save/reload and all three help topics exercised without sending messages.
- Remove/Undo restored the cart line.
- Keyboard quantity controls retained focus after DOM updates; Escape closed item sheets.
- Reduced-motion mode disabled ingredient animations.
- Seven screens checked at 320, 375, 390, 430, 768, 1024 and 1440px: no horizontal page overflow. The build invitation's deliberately cropped image extends inside its clipped image container; text is not clipped.
- A 320px item sheet had no horizontal overflow. All visible text families were Oswald.

No real WhatsApp message or order was sent. Final restaurant confirmation and payment are outside this release, as agreed with the user.
