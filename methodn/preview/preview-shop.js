/* MethodN preview — shopping behavior + simulated cart (localStorage).
   This is PREVIEW-ONLY. The real theme uses Shopify's AJAX Cart API (assets/theme.js). */
(function () {
  'use strict';
  var KEY = 'mn_cart_v1';
  var FREE = 7500; // $75 free-shipping threshold (cents)
  var money = function (c) { return '$' + (c / 100).toFixed(2); };

  function get() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(items) { localStorage.setItem(KEY, JSON.stringify(items)); render(); }

  function add(item) {
    var items = get();
    var ex = items.find(function (i) { return i.id === item.id; });
    if (ex) ex.qty += item.qty; else items.push(item);
    save(items);
    openDrawer();
  }
  function remove(id) { save(get().filter(function (i) { return i.id !== id; })); }

  function render() {
    var items = get();
    var count = items.reduce(function (s, i) { return s + i.qty; }, 0);
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count; el.hidden = count === 0;
    });
    var body = document.querySelector('[data-cart-body]');
    var foot = document.querySelector('[data-cart-foot]');
    if (!body) return;
    if (!items.length) {
      body.innerHTML = '<div class="cart-empty"><p>Your cart is empty.</p><a class="btn btn--primary" href="/preview/shop.html" data-cart-close>Shop patches</a></div>';
      if (foot) foot.hidden = true;
      return;
    }
    if (foot) foot.hidden = false;
    var total = items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var remaining = Math.max(FREE - total, 0);
    var pct = Math.min((total / FREE) * 100, 100);
    var bar = '<div class="ship-bar"><div class="ship-bar__text">' +
      (remaining > 0 ? 'You\'re <strong>' + money(remaining) + '</strong> away from free shipping'
                     : '🎉 You\'ve unlocked <strong>free shipping</strong>') +
      '</div><div class="ship-bar__track"><div class="ship-bar__fill" style="width:' + pct + '%"></div></div></div>';
    var savings = 0, hasOneTime = false;
    var lines = items.map(function (i) {
      if (i.sub && i.base) savings += (i.base - i.price) * i.qty;
      var action = i.sub
        ? '<div class="cart-line__sub-tag"><svg viewBox="0 0 24 24"><use href="#i-refresh"/></svg> Subscription · 20% off</div>'
        : '<button class="cart-line__upsell" data-subscribe="' + i.id + '">Subscribe &amp; save 20% →</button>';
      if (!i.sub) hasOneTime = true;
      var img = i.img || '/assets/methodnproductimage.jpeg';
      return '<div class="cart-line"><img src="' + img + '" alt="' + i.title + '" width="64" height="64">' +
        '<div><div class="cart-line__title">' + i.title + '</div>' +
        '<div class="cart-line__meta">' + i.meta + '</div>' +
        '<div class="cart-line__meta">Qty ' + i.qty + '</div>' +
        action +
        '<div><button class="cart-line__remove" data-remove="' + i.id + '">Remove</button></div></div>' +
        '<div class="cart-line__title">' + money(i.price * i.qty) + '</div></div>';
    }).join('');
    body.innerHTML = bar + lines;

    var t = document.querySelector('[data-cart-total]');
    if (t) t.textContent = money(total);

    var sv = document.querySelector('[data-cart-savings]');
    if (sv) sv.innerHTML = savings > 0
      ? '<div class="cart-savings"><span><svg viewBox="0 0 24 24" width="15" style="vertical-align:-3px"><use href="#i-refresh"/></svg> You\'re saving with Subscribe &amp; Save</span><span>−' + money(savings) + '</span></div>'
      : '';

    // Upgrade upsell: nudge a shorter supply toward the 6-month best value
    var up = items.find(function (i) { var m = (i.id.match(/nadpatch-(\d+)-/) || [])[1]; return m && m !== '6'; });
    var ug = document.querySelector('[data-cart-upgrade]');
    if (ug) ug.innerHTML = up
      ? '<button class="cart-upgrade" data-upgrade="' + up.id + '"><span>⬆ Upgrade to the <strong>6-month supply</strong> — $39/mo, save 20%</span><span class="cart-upgrade__go">Upgrade →</span></button>'
      : '';

    // First-order intro offer (applied at Shopify checkout for subscriptions)
    var hasSubLine = items.some(function (i) { return i.sub; });
    var intro = document.querySelector('[data-cart-intro]');
    if (intro) intro.innerHTML = hasSubLine
      ? '<div class="cart-intro">🎁 New customer? <strong>50% off your first month</strong> — applied at checkout.</div>'
      : '';

    var up = document.querySelector('[data-cart-upsell]');
    if (up) up.innerHTML = hasOneTime
      ? '<div class="cart-upsell-banner"><svg viewBox="0 0 24 24"><use href="#i-refresh"/></svg> Switch to subscribe and save 20% + free shipping</div>'
      : '<div class="cart-upsell-banner"><svg viewBox="0 0 24 24"><use href="#i-check"/></svg> Your subscription ships free — skip or cancel anytime</div>';
  }

  var TIER_BASE = { '1': 4900, '2': 9400, '3': 13500, '6': 23400 };
  var TIER_LABEL = { '1': '1-month supply', '2': '2-month supply', '3': '3-month supply', '6': '6-month supply' };
  function upgrade(id) {
    var items = get();
    var it = items.find(function (i) { return i.id === id; });
    if (!it) return;
    var sub = !!it.sub;
    var freq = (it.id.match(/-sub(\d+)$/) || [])[1] || '1';
    it.base = TIER_BASE['6'];
    it.price = sub ? Math.round(TIER_BASE['6'] * 0.8) : TIER_BASE['6'];
    it.meta = sub ? (TIER_LABEL['6'] + ' · Subscribe & Save · every ' + freq + ' mo') : (TIER_LABEL['6'] + ' · One-time');
    var newId = sub ? ('nadpatch-6-sub' + freq) : 'nadpatch-6-once';
    var ex = items.find(function (i) { return i.id === newId && i !== it; });
    it.id = newId;
    if (ex) { ex.qty += it.qty; items = items.filter(function (i) { return i !== it; }); }
    save(items);
    toast('Upgraded to the 6-month supply 🎉');
  }

  function subscribe(id) {
    var items = get();
    var it = items.find(function (i) { return i.id === id; });
    if (!it || it.sub) return;
    var base = it.base || it.price;
    it.sub = true;
    it.base = base;
    it.price = Math.round(base * 0.8);
    it.meta = it.meta.replace('One-time', 'Subscribe & Save · every 30 days');
    var newId = id.replace(/-once$/, '-sub30');
    var ex = items.find(function (i) { return i.id === newId && i !== it; });
    it.id = newId;
    if (ex) { ex.qty += it.qty; items = items.filter(function (i) { return i !== it; }); }
    save(items);
  }

  function openDrawer() { var d = document.getElementById('CartDrawer'); if (d) { d.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; } }
  function closeDrawer() { var d = document.getElementById('CartDrawer'); if (d) { d.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; } }
  function openNav() { var n = document.getElementById('MobileNav'); if (n) { n.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; } }
  function closeNav() { var n = document.getElementById('MobileNav'); if (n) { n.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; } }

  /* Inject shared chrome (icon sprite, cart drawer, mobile nav) so pages stay DRY */
  function injectChrome() {
    if (!document.getElementById('mn-sprite')) {
      var sprite = document.createElement('div');
      sprite.innerHTML = SPRITE; document.body.appendChild(sprite.firstChild);
    }
    if (!document.getElementById('CartDrawer')) document.body.insertAdjacentHTML('beforeend', DRAWER);
    if (!document.getElementById('MobileNav')) document.body.insertAdjacentHTML('beforeend', MOBILE_NAV);
    if (!document.querySelector('link[rel="icon"]')) {
      var fav = document.createElement('link');
      fav.rel = 'icon'; fav.type = 'image/svg+xml'; fav.href = '/assets/favicon.svg';
      document.head.appendChild(fav);
    }
    if (!document.getElementById('mn-toast-style')) {
      var st = document.createElement('style'); st.id = 'mn-toast-style';
      st.textContent = '.mn-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);background:#18181B;color:#fff;padding:12px 22px;border-radius:999px;font-size:.9rem;font-weight:500;z-index:500;opacity:0;transition:opacity .3s,transform .3s;box-shadow:0 12px 34px -10px rgba(0,0,0,.5);max-width:90vw;text-align:center}.mn-toast.show{opacity:1;transform:translate(-50%,0)}';
      document.head.appendChild(st);
    }
  }

  var toastTimer;
  function toast(msg) {
    var t = document.querySelector('.mn-toast');
    if (!t) { t = document.createElement('div'); t.className = 'mn-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(function () { t.classList.add('show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2800);
  }

  var DRAWER =
    '<div class="cart-drawer" id="CartDrawer" aria-hidden="true">' +
      '<div class="cart-drawer__overlay" data-cart-close></div>' +
      '<div class="cart-drawer__panel">' +
        '<div class="cart-drawer__head"><h2>Your cart</h2><button class="cart-drawer__close" data-cart-close aria-label="Close"><svg viewBox="0 0 24 24" width="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
        '<div class="cart-drawer__body" data-cart-body></div>' +
        '<div class="cart-drawer__foot" data-cart-foot hidden>' +
          '<div data-cart-upgrade></div>' +
          '<div data-cart-savings></div>' +
          '<div class="cart-totals"><span>Subtotal</span><span data-cart-total>$0.00</span></div>' +
          '<div data-cart-intro></div>' +
          '<a href="#" class="btn btn--primary btn--block btn--lg" data-checkout>Secure checkout</a>' +
          '<div data-cart-upsell></div>' +
          '<p class="cart-note">Shipping &amp; taxes calculated at checkout · 60-day guarantee</p>' +
        '</div>' +
      '</div></div>';

  var MOBILE_NAV =
    '<div class="mobile-nav" id="MobileNav" aria-hidden="true">' +
      '<div class="mobile-nav__overlay" data-nav-close></div>' +
      '<div class="mobile-nav__panel">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px"><span class="header__logo">Method<span style="color:#1aa34b">/N</span></span><button class="header__icon" data-nav-close aria-label="Close"><svg viewBox="0 0 24 24" width="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
        '<a href="/preview/product.html">Shop NAD+ Patches</a><a href="/preview/index.html#how">How it works</a><a href="/preview/index.html#science">The Science</a><a href="/preview/index.html#faq">FAQ</a>' +
      '</div></div>';

  var SPRITE =
    '<svg id="mn-sprite" width="0" height="0" style="position:absolute" aria-hidden="true">' +
    '<symbol id="i-star" viewBox="0 0 24 24"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></symbol>' +
    '<symbol id="i-leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 11-5 16-9 16Z"/><path d="M11 20c0-6 2-9 6-12"/></symbol>' +
    '<symbol id="i-bolt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></symbol>' +
    '<symbol id="i-brain" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 1 5 3 3 0 0 0 3 3 2 2 0 0 0 3-1.7V5.7A2 2 0 0 0 9 4Z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-1 5 3 3 0 0 1-3 3 2 2 0 0 1-3-1.7V5.7A2 2 0 0 1 15 4Z"/></symbol>' +
    '<symbol id="i-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21C5 16 3 12 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 12 19 16 12 21Z"/></symbol>' +
    '<symbol id="i-ig" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></symbol>' +
    '<symbol id="i-tt" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.3 1.7 3.9 4 4.1v3c-1.5 0-2.9-.4-4-1.1V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.1A3 3 0 1 0 13 15V3h3Z"/></symbol>' +
    '<symbol id="i-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/><path d="M9 12l2 2 4-4"/></symbol>' +
    '<symbol id="i-flask" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7 15h10"/></symbol>' +
    '<symbol id="i-truck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/></symbol>' +
    '<symbol id="i-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 4v4h-4"/></symbol>' +
    '<symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></symbol>' +
    '</svg>';

  /* Global event delegation */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-nav-open]')) openNav();
    if (e.target.closest('[data-nav-close]')) closeNav();
    if (e.target.closest('[data-cart-open]')) openDrawer();
    if (e.target.closest('[data-cart-close]')) closeDrawer();
    var rm = e.target.closest('[data-remove]'); if (rm) remove(rm.dataset.remove);
    var sb = e.target.closest('[data-subscribe]'); if (sb) subscribe(sb.dataset.subscribe);
    var ug = e.target.closest('[data-upgrade]'); if (ug) { e.preventDefault(); upgrade(ug.dataset.upgrade); }
    // Newsletter signup (preview)
    var join = e.target.closest('.newsletter__form button');
    if (join) {
      e.preventDefault();
      var inp = join.closest('.newsletter__form').querySelector('input');
      if (inp && /.+@.+\..+/.test(inp.value)) { toast("🎉 You're on the list — check your inbox for 10% off."); inp.value = ''; }
      else { toast('Please enter a valid email address.'); if (inp) inp.focus(); }
      return;
    }
    // Checkout (preview placeholder for Shopify-hosted checkout)
    if (e.target.closest('[data-checkout]')) {
      e.preventDefault();
      toast('Proceeding to secure checkout… (live checkout activates once connected to Shopify)');
      return;
    }
    var tier = e.target.closest('[data-tier]');
    if (tier) {
      e.preventDefault();
      var months = tier.dataset.months;
      var base = parseInt(tier.dataset.base, 10);
      var labels = { '1': '1-month supply', '2': '2-month supply', '3': '3-month supply', '6': '6-month supply' };
      add({
        id: 'nadpatch-' + months + '-sub1',
        title: 'Method/N NAD+ Patches',
        meta: labels[months] + ' · Subscribe & Save · every 1 mo',
        price: Math.round(base * 0.8), qty: 1, sub: true, base: base,
        img: '/assets/methodnproductimage.jpeg'
      });
    }
    var qm = e.target.closest('[data-qty-minus]'); var qp = e.target.closest('[data-qty-plus]');
    if (qm || qp) {
      var w = (qm || qp).closest('.qty'); var inp = w.querySelector('input');
      var v = parseInt(inp.value, 10) || 1; v = qp ? v + 1 : Math.max(1, v - 1); inp.value = v;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // Graceful handling for preview placeholder links (account, social, legal)
    var ph = e.target.closest('a[href="#"]');
    if (ph) { e.preventDefault(); toast('Available on the live store.'); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); closeNav(); } });

  function initReveal() {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  }
  function initSticky() {
    var sticky = document.querySelector('[data-sticky-atc]');
    var anchor = document.querySelector('[data-atc-anchor]');
    if (!sticky || !anchor) return;
    new IntersectionObserver(function (e) { sticky.classList.toggle('is-visible', !e[0].isIntersecting); },
      { rootMargin: '0px 0px -80px 0px' }).observe(anchor);
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectChrome();
    initReveal();
    initSticky();
    render();
  });

  window.MN = { add: add, render: render };
})();
