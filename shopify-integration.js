/**
 * ============================================================
 * SHOPIFY INTEGRATION SCRIPT
 * ============================================================
 * INSTRUÇÕES:
 * 1. Aceda ao painel da Shopify
 * 2. Vá a Online Store → Themes → Edit code
 * 3. Abra o ficheiro theme.liquid (ou layout/theme.liquid)
 * 4. Cole este script ANTES de </body>
 *
 * ALTERNATIVA (recomendada):
 * Vá a Settings → Checkout → Additional scripts
 * e cole este script lá.
 *
 * IMPORTANTE: Substitua CHECKOUT_URL pelo URL onde o seu
 * checkout está hospedado (ex: https://seudominio.com/checkout)
 * ============================================================
 */

(function () {
  'use strict';

  // ============================================================
  // CONFIGURAÇÃO — ALTERE AQUI
  // ============================================================
  var CHECKOUT_URL = 'https://seudominio.com/checkout/index.html';
  // Exemplo: 'https://checkout.vinhashop.pt/index.html'
  // ============================================================

  /**
   * Intercepta o clique no botão "Finalizar Compra" da Shopify
   * e redireciona para o nosso checkout personalizado
   */
  function interceptCheckoutButton() {
    // Seletores comuns do botão de checkout na Shopify
    var selectors = [
      '[name="checkout"]',
      '.cart__checkout',
      '#checkout',
      '.btn--checkout',
      '[data-checkout-btn]',
      'button[type="submit"][name="checkout"]',
      '.cart-checkout-button',
      '#CartDrawer-Checkout',
      '#cart-checkout-button',
    ];

    selectors.forEach(function (sel) {
      var btns = document.querySelectorAll(sel);
      btns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          redirectToCheckout();
        });
      });
    });

    // Observer para elementos dinâmicos (cart drawer, etc.)
    var observer = new MutationObserver(function () {
      selectors.forEach(function (sel) {
        var btns = document.querySelectorAll(sel);
        btns.forEach(function (btn) {
          if (!btn._customCheckoutBound) {
            btn._customCheckoutBound = true;
            btn.addEventListener('click', function (e) {
              e.preventDefault();
              e.stopPropagation();
              redirectToCheckout();
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Busca o carrinho atual via Shopify AJAX API e redireciona
   */
  function redirectToCheckout() {
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        var items = (cart.items || []).map(function (item) {
          return {
            id: String(item.variant_id || item.id),
            name: item.product_title || item.title,
            category: item.vendor || '',
            meta: item.variant_title !== 'Default Title' ? (item.variant_title || '') : '',
            image: item.featured_image && item.featured_image.url
              ? item.featured_image.url
              : (item.image || ''),
            price: (item.price / 100).toFixed(2),  // Shopify devolve centavos
            qty: item.quantity,
          };
        });

        var qs = encodeURIComponent(JSON.stringify(items));
        window.location.href = CHECKOUT_URL + '?items=' + qs;
      })
      .catch(function (err) {
        console.error('Erro ao carregar carrinho:', err);
        // Fallback: redirecionar sem itens
        window.location.href = CHECKOUT_URL;
      });
  }

  // ============================================================
  // INICIALIZAR QUANDO O DOM ESTIVER PRONTO
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', interceptCheckoutButton);
  } else {
    interceptCheckoutButton();
  }

})();
