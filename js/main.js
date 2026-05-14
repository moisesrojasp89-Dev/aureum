/* ============================================================
   AUREUM · main.js
   - Mobile menu con accesibilidad
   - Precios en vivo: Oro (CoinGecko), BTC (CoinGecko), SP500 estimado
   - Flash de precio en cambios
   - Timestamp de última actualización
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

  // Cerrar al hacer click en cualquier link del menú
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Cerrar con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  // Cerrar si se hace click fuera
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) closeMenu();
  });
})();

/* ── PRECIO EN VIVO ──────────────────────────────────────── */
(function initLivePrices() {

  const REFRESH_MS = 30_000; // 30 segundos

  // Mapeo de IDs de CoinGecko
  const GeckoIds = {
    btc:  'bitcoin',
    gold: 'pax-gold', // PAXG — mejor aproximación disponible en CoinGecko gratuito
  };

  // Caché de precios anteriores para detectar dirección
  const prev = { gold: null, btc: null, sp: null };

  /**
   * Actualiza el DOM de un ticker card
   * @param {string} key       - 'gold' | 'btc' | 'sp'
   * @param {number} price     - precio actual
   * @param {number} changePct - cambio % 24h
   */
  function updateCard(key, price, changePct) {
    const priceEl  = document.getElementById(`price-${key}`);
    const changeEl = document.getElementById(`change-${key}`);
    if (!priceEl || !changeEl) return;

    // Formatear precio
    const formatted = formatPrice(key, price);

    // Detectar dirección para flash
    const direction = prev[key] === null ? null
      : price > prev[key] ? 'up' : price < prev[key] ? 'down' : null;

    prev[key] = price;

    // Flash
    if (direction) {
      priceEl.classList.remove('flash-up', 'flash-down');
      void priceEl.offsetWidth; // forzar reflow
      priceEl.classList.add(`flash-${direction}`);
    }

    const sign    = changePct >= 0 ? '+' : '';
    const cls     = changePct >= 0 ? 'up' : 'down';
    const arrow   = changePct >= 0 ? '▲' : '▼';

    priceEl.textContent              = formatted;
    changeEl.textContent             = `${arrow} ${sign}${changePct.toFixed(2)}%`;
    changeEl.className               = `ticker-change ${cls}`;
  }

  /** Formatea el precio según el activo */
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

  /** Actualiza el timestamp */
  function updateTimestamp() {
    const el = document.getElementById('update-time');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  /** Obtiene precios de CoinGecko (API pública, sin key) */
  async function fetchPrices() {
    const ids = `${GeckoIds.btc},${GeckoIds.gold}`;
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    return res.json();
  }

  /** Refresca todos los precios */
  async function refresh() {
    try {
      const data = await fetchPrices();

      // BTC
      const btc = data[GeckoIds.btc];
      if (btc) updateCard('btc', btc.usd, btc.usd_24h_change);

      // Oro (PAXG es el proxy más cercano en CoinGecko gratuito)
      const gold = data[GeckoIds.gold];
      if (gold) updateCard('gold', gold.usd, gold.usd_24h_change);

      // SP500 — CoinGecko no cubre índices tradicionales.
      // Mostramos un placeholder honesto hasta integrar una API de mercados.
      showSpPlaceholder();

      updateTimestamp();

    } catch (err) {
      console.warn('[Aureum] Error al obtener precios:', err.message);
      showError();
    }
  }

  /** SP500 no disponible en CoinGecko — muestra estado de indisponible */
  function showSpPlaceholder() {
    const priceEl  = document.getElementById('price-sp');
    const changeEl = document.getElementById('change-sp');
    if (priceEl && !priceEl.dataset.loaded) {
      priceEl.textContent  = 'N/D';
      changeEl.textContent = '—';
      changeEl.className   = 'ticker-change';
    }
  }

  /** Muestra guiones si hay error de red */
  function showError() {
    ['gold', 'btc', 'sp'].forEach(key => {
      const priceEl  = document.getElementById(`price-${key}`);
      const changeEl = document.getElementById(`change-${key}`);
      if (priceEl && priceEl.textContent === '—') {
        priceEl.textContent  = '—';
        changeEl.textContent = '—';
      }
    });
  }

  // Arrancar inmediatamente y luego repetir
  refresh();
  setInterval(refresh, REFRESH_MS);

})();

/* ── SMOOTH SCROLL PARA ANCHORS INTERNOS ────────────────── */
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
