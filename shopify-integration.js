/**
 * SHOPIFY INTEGRATION SCRIPT — WayMB + UTMify
 * Cole este script no theme.liquid (como <script>...</script>) antes do </body>
 * IMPORTANTE: Este script deve estar DEPOIS do pixel UTMify no theme.liquid
 */
(function() {
    // ---- CONFIGURAÇÃO ----
    const CHECKOUT_URL = 'https://coruscating-cassata-8f4e62.netlify.app'; // <-- O SEU LINK
    // ----------------------

    // 1. Capturar o pixelId já configurado pelo pixel UTMify no theme.liquid
    function getPixelId() {
        return window.pixelId || '';
    }

    // 2. Capturar todos os parâmetros UTM da URL actual da loja
    function getUTMParams() {
        const params = new URLSearchParams(window.location.search);
        const utms = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'src'].forEach(key => {
            if (params.get(key)) utms[key] = params.get(key);
        });
        return utms;
    }

    // 3. Redirecionamento de Segurança (se o /checkout nativo for carregado de alguma forma)
    if (window.location.pathname.includes('/checkout')) {
        fetch('/cart.js').then(r => r.json()).then(cart => {
            if (cart.items && cart.items.length > 0) {
                goToWayMBCheckout(cart);
            }
        });
        return;
    }

    // 4. Função principal de redireccionamento
    function goToWayMBCheckout(cart) {
        const items = cart.items.map(item => ({
            id:      item.id,
            name:    item.product_title,
            variant: item.variant_title !== 'Default Title' ? item.variant_title : '',
            vendor:  item.vendor,
            price:   item.price / 100,
            qty:     item.quantity,
            img:     item.image
        }));

        // Montar parâmetros finais
        const params = new URLSearchParams();
        params.set('items', JSON.stringify(items));

        // Incluir pixelId e UTMs
        const pixelId = getPixelId();
        if (pixelId) params.set('pixelId', pixelId);

        const utms = getUTMParams();
        Object.entries(utms).forEach(([k, v]) => params.set(k, v));

        window.location.href = `${CHECKOUT_URL}?${params.toString()}`;
    }

    // 5. Interceptar o clique no botão de checkout
    function interceptCheckout(e) {
        if (window.isRedirecting) return;

        const btn = e.target.closest([
            'input[name="checkout"]',
            'button[name="checkout"]',
            '[href="/checkout"]',
            '.checkout-button',
            'form[action="/checkout"] button[type="submit"]',
            'form[action="/cart"] [type="submit"]'
        ].join(','));

        if (btn) {
            e.preventDefault();
            e.stopImmediatePropagation();
            window.isRedirecting = true;

            fetch('/cart.js')
                .then(r => r.json())
                .then(cart => {
                    if (!cart.items || cart.items.length === 0) {
                        window.isRedirecting = false;
                        return;
                    }
                    goToWayMBCheckout(cart);
                })
                .catch(() => {
                    window.isRedirecting = false;
                    window.location.href = '/checkout';
                });
        }
    }

    // "capture: true" garante que o nosso listener corre ANTES dos outros scripts do tema
    document.addEventListener('click', interceptCheckout, true);
    document.addEventListener('submit', function(e) {
        if (e.target.action && (e.target.action.includes('/checkout') || e.target.action.includes('/cart'))) {
            interceptCheckout(e);
        }
    }, true);

    console.log('[WayMB] Script de checkout ativo.');
})();
