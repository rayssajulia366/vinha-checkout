# Checkout Personalizado — MBWAY & Multibanco

## Estrutura de Ficheiros

```
checkout mbway/
├── index.html              ← Página do checkout
├── style.css               ← Estilos
├── checkout.js             ← Lógica do checkout
├── shopify-integration.js  ← Script a colar na Shopify
└── assets/
    ├── mbway-logo.svg
    └── mb-logo.svg
```

---

## Como integrar na Shopify

### Passo 1 — Hospedar o checkout

Faça upload desta pasta para o seu servidor/hosting (ex: Netlify, Vercel, VPS, etc.).
Anote o URL onde ficará acessível, por exemplo:
```
https://checkout.seudominio.pt/index.html
```

### Passo 2 — Configurar o script

Abra o ficheiro `shopify-integration.js` e altere a linha:
```javascript
var CHECKOUT_URL = 'https://seudominio.com/checkout/index.html';
```
para o URL real do seu checkout.

### Passo 3 — Adicionar à Shopify

1. Aceda ao painel admin da Shopify
2. Vá a **Online Store → Themes → Edit code**
3. Abra `layout/theme.liquid`
4. Cole o conteúdo de `shopify-integration.js` **antes de `</body>`**

**OU (mais simples)**:
- Vá a **Settings → Checkout → Additional scripts**
- Cole o script lá

### Passo 4 — Testar

1. Adicione produtos ao carrinho na sua Shopify
2. Clique em "Finalizar Compra"
3. Deverá ser redirecionado para o checkout personalizado com os produtos passados via URL

---

## Como os dados são passados

O script da Shopify usa a API `/cart.js` para ler o carrinho e passa os dados via URL:

```
https://checkout.seusite.pt/index.html?items=[{"id":"123","name":"Produto","price":"29.90","qty":"2","image":"url"}]
```

### Parâmetros por produto:
| Campo | Descrição |
|-------|-----------|
| `id` | ID da variante Shopify |
| `name` | Nome do produto |
| `category` | Fornecedor (vendor) |
| `meta` | Variante (cor, tamanho, etc.) |
| `image` | URL da imagem |
| `price` | Preço unitário (já convertido de centavos) |
| `qty` | Quantidade |

---

## Próximo Passo — Integração com Gateway de Pagamento

Na próxima fase, iremos integrar os gateways:
- **MBWAY** — API do gateway escolhido
- **Multibanco** — Geração de referência via gateway

A função `processPayment()` em `checkout.js` está preparada para receber a integração.
