/**
 * SHOPIFY INTEGRATION SCRIPT
 * Adicione este script ao seu ficheiro theme.liquid ou num bloco de script personalizado.
 */
(function() {
    // ---- CONFIGURAÇÃO ----
    const CHECKOUT_URL = 'https://o-seu-site-na-vercel.app'; // <--- MUDE PARA O SEU LINK DA VERCEL
    // ----------------------

    function handleCheckoutRedirect(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('Redirecionando para checkout personalizado...');

        // 1. Procurar os dados do carrinho no Shopify (via AJAX API)
        fetch('/cart.js')
            .then(res => res.json())
            .then(cart => {
                if (!cart.items || cart.items.length === 0) {
                    alert('O seu carrinho está vazio.');
                    return;
                }

                // 2. Mapear os produtos para o formato do nosso checkout
                const items = cart.items.map(item => ({
                    id: item.id,
                    name: item.product_title,
                    variant: item.variant_title !== 'Default Title' ? item.variant_title : '',
                    vendor: item.vendor,
                    price: item.price / 100, // Shopify envia em cêntimos
                    qty: item.quantity,
                    img: item.image
                }));

                // 3. Gerar a URL final com os parâmetros
                const jsonItems = encodeURIComponent(JSON.stringify(items));
                window.location.href = `${CHECKOUT_URL}?items=${jsonItems}`;
            })
            .catch(err => {
                console.error('Erro ao processar checkout:', err);
                window.location.href = '/checkout'; // Fallback para o checkout do Shopify se falhar
            });
    }

    // Tentar encontrar os botões de checkout (padrões do Shopify)
    function attachEvents() {
        const checkoutButtons = document.querySelectorAll('form[action="/cart"] [name="checkout"], .checkout-button, [href="/checkout"]');
        
        checkoutButtons.forEach(btn => {
            if (btn.dataset.integrated !== 'true') {
                btn.addEventListener('click', handleCheckoutRedirect);
                btn.dataset.integrated = 'true';
            }
        });
    }

    // Rodar ao carregar e monitorizar mudanças no DOM (para carrinhos laterais/ajax)
    attachEvents();
    const observer = new MutationObserver(attachEvents);
    observer.observe(document.body, { childList: true, subtree: true });
})();
