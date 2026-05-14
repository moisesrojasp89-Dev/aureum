/* ============================================================
   AUREUM · main.js
   - Mobile menu con accesibilidad
   - Precios en vivo: Oro (CoinGecko), BTC (CoinGecko)
   - Flash de precio en cambios
   - Timestamp de última actualización
   - Precios en tarjetas de mercado
   ============================================================ */

'use strict';

/* ── MOBILE MENU ─────────────────────────────────────────── */
(function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu   = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add('active');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    menu.classList.remove('active');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  }

  toggle.addEventListener('click', () => {
    menu.classList.contains('active') ? closeMenu() : openMenu();
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) closeMenu();
  });
})();

/* ── PRECIOS EN VIVO ─────────────────────────────────────── */
(function initLivePrices() {

  const REFRESH_MS = 30_000;

  const GECKO_IDS = {
    btc:  'bitcoin',
    gold: 'pax-gold',
  };

  const prev = { gold: null, btc: null };

  function formatPrice(key, price) {
    if (key === 'btc') {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(price);
    }
    return new Intl.NumberFormat('es-ES', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(price);
  }

  function formatChange(pct) {
    const sign  = pct >= 0 ? '+' : '';
    const arrow = pct >= 0 ? '▲' : '▼';
    return { text: `${arrow} ${sign}${pct.toFixed(2)}%`, cls: pct >= 0 ? 'up' : 'down' };
  }

  function flashEl(el, direction) {
    el.classList.remove('flash-up', 'flash-down');
    void el.offsetWidth;
    el.classList.add(`flash-${direction}`);
  }

  /* Hero tickers */
  function updateHeroTicker(key, price, changePct) {
    const priceEl  = document.getElementById(`price-${key}`);
    const changeEl = document.getElementById(`change-${key}`);
    if (!priceEl || !changeEl) return;

    const direction = prev[key] !== null
      ? (price > prev[key] ? 'up' : price < prev[key] ? 'down' : null)
      : null;

    prev[key] = price;
    if (direction) flashEl(priceEl, direction);

    priceEl.textContent = formatPrice(key, price);
    const { text, cls } = formatChange(changePct);
    changeEl.textContent = text;
    changeEl.className   = `ticker-change ${cls}`;
  }

  /* Market cards */
  function updateMarketCard(key, price, changePct) {
    const priceEl  = document.getElementById(`mcard-price-${key}`);
    const changeEl = document.getElementById(`mcard-change-${key}`);
    if (!priceEl || !changeEl) return;

    priceEl.textContent = formatPrice(key, price);
    const { text, cls } = formatChange(changePct);
    changeEl.textContent = text;
    changeEl.className   = `mcard-change ${cls}`;
  }

  function updateTimestamp() {
    const el = document.getElementById('update-time');
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit',
    });
  }

  async function fetchPrices() {
    const ids = Object.values(GECKO_IDS).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    return res.json();
  }

  async function refresh() {
    try {
      const data = await fetchPrices();

      const btc  = data[GECKO_IDS.btc];
      const gold = data[GECKO_IDS.gold];

      if (btc) {
        updateHeroTicker('btc', btc.usd, btc.usd_24h_change);
        updateMarketCard('btc', btc.usd, btc.usd_24h_change);
      }

      if (gold) {
        updateHeroTicker('gold', gold.usd, gold.usd_24h_change);
        updateMarketCard('gold', gold.usd, gold.usd_24h_change);
      }

      // SP500 no disponible en CoinGecko gratuito — Fase 2
      const spPrice  = document.getElementById('mcard-price-sp');
      const spChange = document.getElementById('mcard-change-sp');
      if (spPrice  && spPrice.textContent  === '—') spPrice.textContent  = 'N/D';
      if (spChange && spChange.textContent === '—') spChange.textContent = '—';

      updateTimestamp();

    } catch (err) {
      console.warn('[Aureum] Error precios:', err.message);
    }
  }

  refresh();
  setInterval(refresh, REFRESH_MS);

})();

/* ── SMOOTH SCROLL ───────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
