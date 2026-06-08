/* ==========================================================================
   MethodN theme JS — AJAX cart, drawer, product UX, reveal animations
   Vanilla JS, no dependencies. Uses Shopify AJAX Cart API.
   ========================================================================== */
(function () {
  'use strict';

  const money = (cents) =>
    (window.Shopify && Shopify.formatMoney)
      ? Shopify.formatMoney(cents, window.themeSettings && window.themeSettings.moneyFormat)
      : '$' + (cents / 100).toFixed(2);

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------------------------------------------------------------------- */
  /* Cart store + drawer                                                    */
  /* ---------------------------------------------------------------------- */
  const Cart = {
    drawer: null,
    settings: window.themeSettings || {},

    init() {
      this.drawer = $('#CartDrawer');
      document.addEventListener('click', (e) => {
        const open = e.target.closest('[data-cart-open]');
        if (open) { e.preventDefault(); this.open(); }
        const close = e.target.closest('[data-cart-close]');
        if (close) { e.preventDefault(); this.close(); }
        const remove = e.target.closest('[data-cart-remove]');
        if (remove) { e.preventDefault(); this.changeLine(remove.dataset.cartRemove, 0); }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
      this.refresh();
    },

    open() {
      if (!this.drawer) return;
      this.drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    },
    close() {
      if (!this.drawer) return;
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    },

    async add(formData) {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.description || 'Could not add to cart');
      }
      await this.refresh();
      this.open();
      return res.json();
    },

    async changeLine(key, quantity) {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity }),
      });
      const cart = await res.json();
      this.render(cart);
      return cart;
    },

    async refresh() {
      const res = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      const cart = await res.json();
      this.render(cart);
      return cart;
    },

    render(cart) {
      // Count badges
      $$('[data-cart-count]').forEach((el) => {
        el.textContent = cart.item_count;
        el.hidden = cart.item_count === 0;
      });

      const body = $('[data-cart-body]', this.drawer);
      const foot = $('[data-cart-foot]', this.drawer);
      if (!body) return;

      if (cart.item_count === 0) {
        body.innerHTML = `<div class="cart-empty">
            <p>Your cart is empty.</p>
            <a class="btn btn--primary" href="/collections/all" data-cart-close>Shop patches</a>
          </div>`;
        if (foot) foot.hidden = true;
        return;
      }

      if (foot) foot.hidden = false;

      // Free shipping progress
      const threshold = (this.settings.freeShippingThreshold || 0) * 100;
      const showBar = this.settings.showFreeShippingBar && threshold > 0;
      let shipBar = '';
      if (showBar) {
        const remaining = Math.max(threshold - cart.total_price, 0);
        const pct = Math.min((cart.total_price / threshold) * 100, 100);
        shipBar = `<div class="ship-bar">
            <div class="ship-bar__text">${
              remaining > 0
                ? `You're <strong>${money(remaining)}</strong> away from free shipping`
                : `🎉 You've unlocked <strong>free shipping</strong>`
            }</div>
            <div class="ship-bar__track"><div class="ship-bar__fill" style="width:${pct}%"></div></div>
          </div>`;
      }

      let savings = 0;
      let hasSub = false;
      let hasOneTime = false;

      const lines = cart.items
        .map((item) => {
          const img = item.image
            ? `<img src="${item.image.replace(/(\.[^.]+)$/, '_128x128$1')}" alt="${item.product_title}" loading="lazy">`
            : '<div></div>';
          const isSub = !!item.selling_plan_allocation;
          if (isSub) hasSub = true; else hasOneTime = true;
          // Subscription discount = line price before vs after the plan, if exposed
          const lineSaving = Math.max((item.original_line_price || item.final_line_price) - item.final_line_price, 0);
          savings += lineSaving;
          const subTag = isSub
            ? `<div class="cart-line__sub-tag">↻ ${item.selling_plan_allocation.selling_plan.name}</div>`
            : '';
          const opts = item.options_with_values
            ? item.options_with_values.map((o) => o.value).filter((v) => v !== 'Default Title').join(' / ')
            : '';
          return `<div class="cart-line">
              ${img}
              <div>
                <div class="cart-line__title">${item.product_title}</div>
                ${opts ? `<div class="cart-line__meta">${opts}</div>` : ''}
                ${subTag}
                <div class="cart-line__meta">Qty ${item.quantity}</div>
                <div><button class="cart-line__remove" data-cart-remove="${item.key}">Remove</button></div>
              </div>
              <div class="cart-line__title">${money(item.final_line_price)}</div>
            </div>`;
        })
        .join('');

      body.innerHTML = shipBar + lines;

      const totalEl = $('[data-cart-total]', this.drawer);
      if (totalEl) totalEl.textContent = money(cart.total_price);

      // Savings line (only when a subscription discount is present)
      const savingsEl = $('[data-cart-savings]', this.drawer);
      if (savingsEl) {
        savingsEl.innerHTML = hasSub && savings > 0
          ? `<div class="cart-savings"><span>↻ You're saving with Subscribe &amp; Save</span><span>−${money(savings)}</span></div>`
          : '';
      }

      // Reassurance / upsell banner
      const upsellEl = $('[data-cart-upsell]', this.drawer);
      if (upsellEl) {
        upsellEl.innerHTML = hasOneTime && !hasSub
          ? `<div class="cart-upsell-banner">↻ Subscribe on the product page to save 20% + ship free</div>`
          : (hasSub ? `<div class="cart-upsell-banner">✓ Your subscription ships free — skip or cancel anytime</div>` : '');
      }
    },
  };

  /* ---------------------------------------------------------------------- */
  /* Product form (add to cart)                                             */
  /* ---------------------------------------------------------------------- */
  function initProductForms() {
    $$('[data-product-form]').forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('[type="submit"]');
        const original = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }
        try {
          await Cart.add(new FormData(form));
          if (btn) btn.textContent = 'Added ✓';
        } catch (err) {
          if (btn) btn.textContent = original;
          alert(err.message);
        } finally {
          setTimeout(() => { if (btn) { btn.disabled = false; btn.textContent = original; } }, 1200);
        }
      });
    });
  }

  /* Variant selection -> update price, id, availability */
  function initVariantPickers() {
    $$('[data-variant-picker]').forEach((root) => {
      const data = JSON.parse($('[data-variant-json]', root).textContent);
      const idInput = $('[data-variant-id]', root);
      const priceEl = $('[data-variant-price]', root);
      const compareEl = $('[data-variant-compare]', root);
      const subPriceEls = $$('[data-sub-price]', root);

      function selectedOptions() {
        return $$('[data-option-input]:checked', root).map((i) => i.value);
      }
      function findVariant() {
        const opts = selectedOptions();
        return data.variants.find((v) =>
          v.options.every((o, i) => o === opts[i])
        );
      }
      function update() {
        const v = findVariant();
        if (!v) return;
        idInput.value = v.id;
        if (priceEl) priceEl.textContent = money(v.price);
        if (compareEl) {
          if (v.compare_at_price && v.compare_at_price > v.price) {
            compareEl.textContent = money(v.compare_at_price);
            compareEl.hidden = false;
          } else { compareEl.hidden = true; }
        }
        // Update each purchase option's price from its discount %
        subPriceEls.forEach((el) => {
          const pct = parseFloat(el.dataset.subPrice) || 0;
          el.textContent = money(Math.round(v.price * (1 - pct / 100)));
        });
        const scope = root.closest('[data-product-form]') || document;
        refreshAtcLabel(scope, v.available);
        syncMainPrice(scope, v.price);
      }
      root.addEventListener('change', (e) => {
        if (e.target.matches('[data-option-input]')) update();
      });
      update();
    });
  }

  /* ---- Subscription-forward purchase options ---- */
  function isSubSelected(scope) {
    const sel = $('[name="selling_plan"]:checked', scope);
    return !!(sel && sel.value);
  }
  function refreshAtcLabel(scope, available) {
    const btn = $('[data-atc-text]', scope);
    if (!btn) return;
    if (available === false) { btn.textContent = 'Sold out'; btn.disabled = true; return; }
    btn.disabled = false;
    btn.textContent = isSubSelected(scope)
      ? (btn.dataset.atcLabelSub || 'Subscribe & Save')
      : (btn.dataset.atcLabelOnce || btn.dataset.atcTextDefault || 'Add to cart');
  }
  function toggleSubUi(scope) {
    const sub = isSubSelected(scope);
    const extra = $('[data-sub-extra]', scope);
    if (extra) extra.hidden = !sub;
    const micro = $('[data-atc-micro]', scope);
    if (micro) micro.hidden = !sub;
  }
  function syncMainPrice(scope) {
    const priceEl = $('[data-variant-price]', scope);
    const sel = $('[name="selling_plan"]:checked', scope);
    if (!priceEl || !sel) return;
    const opt = sel.closest('.purchase-option');
    const optPrice = opt && opt.querySelector('.purchase-option__title span:last-child');
    if (optPrice) priceEl.textContent = optPrice.textContent.trim();
  }
  function initPurchaseOptions() {
    $$('[data-purchase-options]').forEach((root) => {
      const scope = root.closest('[data-product-form]') || document;
      root.addEventListener('change', (e) => {
        if (e.target.matches('[name="selling_plan"]')) {
          refreshAtcLabel(scope, true);
          toggleSubUi(scope);
          syncMainPrice(scope);
        }
      });
      refreshAtcLabel(scope, true);
      toggleSubUi(scope);
      syncMainPrice(scope);
    });
  }

  /* Gallery thumbnails */
  function initGallery() {
    $$('[data-gallery]').forEach((g) => {
      const main = $('[data-gallery-main]', g);
      g.addEventListener('click', (e) => {
        const thumb = e.target.closest('[data-gallery-thumb]');
        if (!thumb) return;
        main.src = thumb.dataset.full;
        $$('[data-gallery-thumb]', g).forEach((t) => t.classList.toggle('is-active', t === thumb));
      });
    });
  }

  /* Quantity steppers */
  function initQty() {
    document.addEventListener('click', (e) => {
      const minus = e.target.closest('[data-qty-minus]');
      const plus = e.target.closest('[data-qty-plus]');
      if (!minus && !plus) return;
      const wrap = (minus || plus).closest('.qty');
      const input = $('input', wrap);
      let val = parseInt(input.value, 10) || 1;
      val = plus ? val + 1 : Math.max(1, val - 1);
      input.value = val;
    });
  }

  /* Sticky mobile add-to-cart */
  function initStickyAtc() {
    const sticky = $('[data-sticky-atc]');
    const anchor = $('[data-atc-anchor]');
    if (!sticky || !anchor) return;
    const io = new IntersectionObserver(
      ([entry]) => sticky.classList.toggle('is-visible', !entry.isIntersecting),
      { rootMargin: '0px 0px -80px 0px' }
    );
    io.observe(anchor);
  }

  /* Mobile nav toggle */
  function initMobileNav() {
    const nav = $('#MobileNav');
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-nav-open]')) { nav.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
      if (e.target.closest('[data-nav-close]')) { nav.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
    });
  }

  /* Scroll reveal */
  function initReveal() {
    const els = $$('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    Cart.init();
    initProductForms();
    initVariantPickers();
    initPurchaseOptions();
    initGallery();
    initQty();
    initStickyAtc();
    initMobileNav();
    initReveal();
  });

  window.MethodNCart = Cart;
})();
