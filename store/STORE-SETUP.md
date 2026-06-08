# MethodN — Store Build Runbook

Everything needed to take the store from empty to launch-ready. Theme files live one level up (`../`); this folder holds the **store content** — catalog, collections, navigation, and page copy.

Work top to bottom. Estimated time: ~45–60 minutes.

---

## 0. Prerequisites
- A Shopify store (or free [Partner dev store](https://partners.shopify.com)).
- The theme pushed to the store (`shopify theme push --unpublished --theme "MethodN"` from `../`).

---

## 1. Import the product catalog
**Admin → Products → Import → Add file →** `products.csv`, then **Upload and continue → Import products**.

This creates 6 products:

| Product | Variants | Price | Tags (drive collections) |
|---|---|---|---|
| MethodN Energy Patch | 30 / 60 / 90-count | $48 / $90 / $129 | `goal-energy`, `bestseller` |
| MethodN Focus Patch | 30 / 60 / 90-count | $48 / $90 / $129 | `goal-focus`, `bestseller` |
| MethodN Recovery Patch | 30 / 60 / 90-count | $52 / $98 / $139 | `goal-recovery` |
| MethodN Sleep Patch | 30 / 60 / 90-count | $48 / $90 / $129 | `goal-sleep` |
| MethodN Discovery Kit | single | $19 | `starter`, `trial` |
| The MethodN Daily Stack | single | $84 | `bundle`, `bestseller` |

> Prices/compare-at are research-backed starters (~$1.60/day). Edit freely in admin.
> The CSV has no images (add your product photography per product), and **subscriptions are not in the CSV** — they're added via a subscriptions app in step 5.

---

## 2. Create collections
**Admin → Products → Collections → Create collection.** Use **Automated** collections so they self-populate from the tags above.

| Collection | Handle | Type | Condition |
|---|---|---|---|
| All Patches | `all` | Automated | Product type **is equal to** `NAD+ Patch` |
| Bestsellers | `bestsellers` | Automated | Product tag **is equal to** `bestseller` |
| Energy | `energy` | Automated | Product tag **is equal to** `goal-energy` |
| Focus | `focus` | Automated | Product tag **is equal to** `goal-focus` |
| Recovery | `recovery` | Automated | Product tag **is equal to** `goal-recovery` |
| Sleep | `sleep` | Automated | Product tag **is equal to** `goal-sleep` |
| Bundles & Kits | `bundles` | Automated | Product type **is equal to** `Bundle` |

After creating, set each collection's **image** (used by the homepage *Shop by goal* and *All collections* sections).

---

## 3. Build the navigation
**Admin → Online Store → Navigation.** The theme references the handles `main-menu` and `footer`.

**Main menu** (`main-menu`):
- Shop All → `/collections/all`
- Energy → `/collections/energy`
- Focus → `/collections/focus`
- Recovery → `/collections/recovery`
- Sleep → `/collections/sleep`
- Bundles → `/collections/bundles`
- The Science → `/pages/the-science`
- Journal → `/blogs/journal`

**Footer menu** (`footer`):
- About → `/pages/about`
- FAQ → `/pages/faq`
- Shipping & Returns → `/pages/shipping-returns`
- Subscriptions → `/pages/subscriptions`
- Contact → `/pages/contact`

**Legal menu** (create as `footer` legal or reuse) — link to the policy pages from step 6.

---

## 4. Create the content pages
**Admin → Online Store → Pages → Add page.** Paste the HTML from `pages/` (switch the editor to **`< >` HTML view** before pasting). Match the handle so nav links resolve.

| Page title | Handle | Source file | Template |
|---|---|---|---|
| About | `about` | `pages/about.html` | Default page |
| The Science | `the-science` | `pages/the-science.html` | Default page |
| FAQ | `faq` | `pages/faq.html` | Default page |
| Shipping & Returns | `shipping-returns` | `pages/shipping-returns.html` | Default page |
| Subscriptions | `subscriptions` | `pages/subscriptions.html` | Default page |
| Contact | `contact` | *(no body needed)* | **page.contact** (the theme's contact-form template) |

> For Contact: create the page, then set its **Theme template** dropdown to `contact`.

Also create a **blog** named *Journal* (handle `journal`) — **Online Store → Blog posts → Manage blogs → Add blog** — to power the `/blogs/journal` link and the article SEO engine.

---

## 5. Turn on Subscribe & Save (high impact for this niche)
1. **Admin → Apps → Shopify App Store →** install **Shopify Subscriptions** (free, first-party) or Recharge/Loop/Skio.
2. Create a **selling plan group**: e.g. "Subscribe & Save", delivery every **30 / 60 / 90 days**, **20% discount**.
3. Apply it to the four patch products and the Daily Stack.

The product page automatically renders the **one-time vs. subscribe** selector as soon as a product has selling plans — no theme edits needed. (Until then it shows a subscribe *teaser* you can toggle off in the product section settings.)

---

## 6. Store policies (legal)
**Admin → Settings → Policies.** Shopify can **generate** Privacy, Refund, Terms, and Shipping policy templates — generate, then edit. Link them from the footer legal menu.
- Keep the **supplement / FDA disclaimer** in the footer accurate for your jurisdiction (editable in the Footer section settings).

---

## 7. Theme settings & homepage wiring
In the **theme editor** (Customize):
- **Theme settings → Brand identity:** upload logo + favicon.
- **Theme settings → Brand colors:** keep *Default* or switch to *Midnight*.
- **Theme settings → Cart:** set free-shipping threshold (matches the $75 in copy).
- **Homepage → Featured collection:** point at `bestsellers`.
- **Homepage → Shop by goal:** set each card's image + link (`/collections/energy`, etc.).
- **Hero / Guarantee / How-it-works CTAs:** point at `/collections/all`.

---

## 8. Reviews (social proof)
Install a reviews app (Judge.me, Okendo, or Shopify Product Reviews). The theme reads the standard `metafields.reviews.rating` + `rating_count` — once the app populates them, star ratings appear on product cards and the product page automatically.

---

## 9. Pre-launch checklist
- [ ] `shopify theme check` passes (run from `../`)
- [ ] All 6 products have images + final pricing
- [ ] 7 collections created and populated
- [ ] Main, footer & legal menus built
- [ ] 5 content pages + Contact page + Journal blog created
- [ ] Subscriptions live on all patch products
- [ ] Policies generated and linked
- [ ] Logo, favicon, brand colors set
- [ ] Test checkout completed (Shopify Bogus Gateway or real)
- [ ] Shipping rates configured (Settings → Shipping)
- [ ] Replace placeholder stats/testimonials with real, substantiated figures
- [ ] Publish the theme (Online Store → Themes → Publish)
