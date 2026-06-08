# MethodN — Custom Shopify Theme

A high-conversion, science-forward Shopify **Online Store 2.0** theme built for **MethodN**, a brand selling transdermal **NAD+ patches** in the longevity / new-age wellness niche.

The design follows the conversion patterns of the best-performing DTC wellness brands (Ritual, Momentous, Tru Niagen): science-first minimalism, benefit-led messaging, transparent trust signals, solution-based ("shop by goal") navigation, subscribe-&-save, heavy social proof, and a strong risk-reversal guarantee.

---

## What's inside

```
MethodN/
├─ assets/            base.css (design system), theme.js (AJAX cart, UX)
├─ config/            settings_schema.json (theme editor), settings_data.json (defaults + presets)
├─ layout/            theme.liquid, password.liquid
├─ locales/           en.default.json
├─ sections/          header, footer, hero, benefits, how-it-works, shop-by-goal,
│                     featured-collection, stats, image-with-text, testimonials,
│                     comparison, faq, guarantee, main-product, main-collection,
│                     main-cart, main-page, main-blog/article, main-search, 404, ...
├─ snippets/          icon, product-card, cart-drawer, meta-tags, social-icons
└─ templates/         index, product, collection, cart, page, page.contact, blog,
                      article, search, list-collections, password, 404, gift_card,
                      customers/*
```

### Key conversion features
- **Sticky AJAX cart drawer** with a free-shipping progress bar (`theme.js`)
- **Subscribe & save vs. one-time** purchase selector on the product page (reads native Shopify selling plans; falls back to an upsell teaser if no subscription app is installed yet)
- **Sticky mobile add-to-cart** bar
- **Shop-by-goal** navigation (Energy / Focus / Recovery / Sleep)
- **Trust bar, comparison table, stats, testimonials, FAQ, 60-day guarantee** sections
- Fully **theme-editor editable** — every section has a schema with presets
- **Two color presets** out of the box: *Default* (warm bone + forest green) and *Midnight* (dark mode)
- Brand colors, fonts, radius, page width all driven from theme settings → CSS custom properties

---

## Connect it to Shopify

You need a Shopify store (or [free Partner dev store](https://partners.shopify.com)) and the **Shopify CLI**.

### 1. Install the Shopify CLI
```bash
# macOS / Linux (Homebrew)
brew tap shopify/shopify && brew install shopify-cli

# Windows / any (npm)
npm install -g @shopify/cli @shopify/theme
```
Verify:
```bash
shopify version
```

### 2. Log in & start a live-reload dev session
From inside the `MethodN/` folder:
```bash
cd MethodN
shopify theme dev --store your-store.myshopify.com
```
This opens a browser at `http://127.0.0.1:9292` rendering the theme against your real store data, with hot reload as you edit files. (First run opens a browser to authenticate.)

### 3. Push the theme to the store
Upload as a new **unpublished** theme (safe — does not change your live store):
```bash
shopify theme push --unpublished --theme "MethodN"
```
Then in **Shopify admin → Online Store → Themes**, preview it, and **Publish** when ready.

Other useful commands:
```bash
shopify theme list                 # see themes on the store
shopify theme pull                 # pull live theme edits back down
shopify theme push                 # push to the currently selected theme
shopify theme check                # lint the theme (Theme Check)
```

### 4. First-run setup in the Shopify admin
1. **Navigation** (`Online Store → Navigation`): create a `main-menu` and `footer` menu — the header/footer reference these handles.
2. **Products & collections**: create your NAD+ patch products. Add a collection (e.g. `all` or `bestsellers`) and point the homepage *Featured collection* section at it in the theme editor.
3. **Shop-by-goal links**: in the theme editor, set each goal card's image + link to the matching collection.
4. **Subscriptions** (optional but recommended for this niche): install **Shopify Subscriptions** (free) or a 3rd-party app. Once selling plans exist on a product, the product page's *Subscribe & save* options appear automatically.
5. **Reviews**: the product card / product page read `metafields.reviews.rating` & `rating_count` (the standard [Shopify Product Reviews] / Judge.me / Okendo metafield namespace). Connect a reviews app to populate them.
6. **Logo & brand**: `Theme editor → Theme settings → Brand identity` to upload the logo/favicon; `Brand colors` to tweak the palette or switch to the *Midnight* preset.

---

## Customizing the look
All design tokens live in **Theme settings** (gear icon in the editor):
- **Brand colors** — background, surface, text, primary, accent
- **Layout** — page width, corner radius
- **Cart** — drawer vs. page, free-shipping threshold

These feed CSS variables in `layout/theme.liquid`, so global restyles take seconds. Fonts are *Fraunces* (headings) + *Inter* (body); swap them in `theme.liquid` and `base.css`.

---

## Notes
- The compliance disclaimer in the footer ("not evaluated by the FDA…") is editable in the Footer section settings — **keep appropriate supplement disclaimers** for your jurisdiction.
- Placeholder copy and stats (ratings, counts) are illustrative — replace with your real, substantiated figures before launch.
- Run `shopify theme check` before publishing to catch any Liquid issues.

Built for Sainto Group.
