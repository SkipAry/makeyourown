# Romae ordering app

Static, ordering-first restaurant app for GitHub Pages. Uses Oswald throughout and hash routes so every screen can be opened or refreshed without server rewrites.

## Run and test

Serve the project directory with `python -m http.server 8010`, then open `http://localhost:8010/`.

Run model tests with `node --test tests/model.test.mjs`. There are no build dependencies.

## Features

- Category navigation, quick add and item option dialogs with size and quantity.
- House-pizza presets and a persistent custom builder with upfront surcharges and a two-portion limit.
- Mobile sticky recipe preview, reduced motion and keyboard focus restoration.
- Cart variant merging, quantity controls, edit-in-builder, explicit removal and Undo.
- Persistent pickup/dine-in checkout, table number, optional phone/note and inline validation.
- Order review and a WhatsApp message draft, including configuration, quantities and estimated total.
- Unconfirmed order drafts, local profile details and help-message preparation.
- Desktop order summary and mobile order bar.

## Business data and release boundary

The user selected **WhatsApp requests for this release**. Nothing is automatically sent. The customer reviews and sends the message in WhatsApp; only Romae's reply confirms an order. No payment, email sign-in or backend tracking is simulated.

Pizza names, base prices, images and the WhatsApp destination retain the preceding implementation. New sides/drinks/dessert entries are clearly labelled preview items. A cart containing any preview item cannot generate a restaurant handoff. Replace preview data with verified business catalog data before enabling those items.

Small/large house-pizza prices use the existing app's ±₹100 size adjustment. Extra toppings use the preceding app's surcharge list. Removing included toppings gives no discount. All prices remain estimates pending restaurant confirmation.

Persistence uses the `romae.v2.*` localStorage namespace. Account details and drafts stay in this browser; there is no cross-device account. Older `romae.*` storage is left untouched rather than silently repricing old recipes. Viewing a saved draft uses the current catalog pricing; drafts are not historical receipts.

## Files

- `index.html`: accessible shell and Oswald font import.
- `app.mjs`: routing, views, persistence and event handling.
- `model.mjs`: catalog, configuration, pricing, cart identity, validation and handoff.
- `app.css`: responsive styling and motion preferences.
- `tests/model.test.mjs`: pricing, merging, editing, validation, handoff and escaping checks.
- `docs/carte-pizza-interaction-audit.md`: reference behaviour and parity checklist.

GitHub Pages publishes the repository root. No secrets or backend credentials belong in this client application.
