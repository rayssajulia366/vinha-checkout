/**
 * CHECKOUT.JS — v2
 * Máscaras, validação em tempo real, limites de campo
 * Português de Portugal (PT-PT)
 */

// ============================================================
// ESTADO GLOBAL
// ============================================================
const state = {
  items: [],
  couponDiscount: 0,
  paymentMethod: 'multibanco',
  shippingMethod: 'normal',
};

// ============================================================
// UTILITÁRIOS
// ============================================================
function formatCurrency(value) {
  return value.toFixed(2).replace('.', ',') + '\u00a0\u20ac';
}

function parsePrice(str) {
  if (typeof str === 'number') return str;
  return parseFloat(String(str).replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ============================================================
// MÁSCARAS DE CAMPOS
// ============================================================

/** Telemóvel PT: 9XX XXX XXX (aceita também +351 9.. ) */
function maskPhone(input) {
  input.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '');
    // remover prefixo 351 se colado com ele
    if (v.startsWith('351') && v.length > 9) v = v.slice(3);
    // limitar a 9 dígitos
    v = v.slice(0, 9);
    // formatar: 9XX XXX XXX
    if (v.length > 6) v = v.slice(0, 3) + ' ' + v.slice(3, 6) + ' ' + v.slice(6);
    else if (v.length > 3) v = v.slice(0, 3) + ' ' + v.slice(3);
    this.value = v;
  });
  input.addEventListener('keydown', function (e) {
    // permitir backspace, delete, tab, setas
    if ([8, 9, 46, 37, 38, 39, 40].includes(e.keyCode)) return;
    // bloquear não-dígitos
    if (!/^\d$/.test(e.key)) e.preventDefault();
  });
}

/** Código Postal PT: XXXX-XXX */
function maskPostalCode(input) {
  input.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 7);
    if (v.length > 4) v = v.slice(0, 4) + '-' + v.slice(4);
    this.value = v;
  });
  input.addEventListener('keydown', function (e) {
    if ([8, 9, 46, 37, 38, 39, 40].includes(e.keyCode)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  });
}

/** NIF: apenas dígitos, máx 9 */
function maskNIF(input) {
  input.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 9);
  });
  input.addEventListener('keydown', function (e) {
    if ([8, 9, 46, 37, 38, 39, 40].includes(e.keyCode)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  });
}

/** Nome / Localidade: só letras, espaços, hífenes e apóstrofos (suporte PT) */
function maskNameField(input) {
  input.addEventListener('input', function () {
    // Remover caracteres inválidos (manter letras com acentos, espaços, hífen, apóstrofo)
    this.value = this.value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ\s\-'\.]/g, '');
  });
}

/** Cupão: apenas alfanumérico maiúsculo */
function maskCoupon(input) {
  input.addEventListener('input', function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  });
}

// ============================================================
// VALIDAÇÃO DE NIF PORTUGUÊS
// ============================================================
function validarNIF(nif) {
  if (!nif || nif.length !== 9) return false;
  const prefixosValidos = [1, 2, 3, 45, 5, 6, 70, 71, 72, 74, 75, 77, 78, 79, 8, 90, 91, 98, 99];
  const prefixo = parseInt(nif.substring(0, 2), 10);
  const prefixo1 = parseInt(nif[0], 10);
  if (![1, 2, 3, 5, 6, 8].includes(prefixo1) && ![45, 70, 71, 72, 74, 75, 77, 78, 79, 90, 91, 98, 99].includes(prefixo)) return false;
  let soma = 0;
  for (let i = 0; i < 8; i++) {
    soma += parseInt(nif[i], 10) * (9 - i);
  }
  const resto = soma % 11;
  const digitoControlo = resto < 2 ? 0 : 11 - resto;
  return digitoControlo === parseInt(nif[8], 10);
}

/** Validar email */
function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Validar telemóvel PT: deve começar por 9, ter 9 dígitos */
function validarTelemovel(tel) {
  const digits = tel.replace(/\D/g, '');
  return digits.length === 9 && digits[0] === '9';
}

/** Validar código postal PT: XXXX-XXX */
function validarCodigoPostal(cp) {
  return /^\d{4}-\d{3}$/.test(cp);
}

// ============================================================
// VALIDAÇÃO EM TEMPO REAL (inline)
// ============================================================
function setFieldState(input, valid, msg) {
  // Remover feedback anterior
  const parent = input.closest('.form-group') || input.parentNode;
  const existingErr = parent.querySelector('.field-error');
  if (existingErr) existingErr.remove();
  const existingOk = parent.querySelector('.field-ok');
  if (existingOk) existingOk.remove();

  input.classList.remove('input-valid', 'input-error');

  if (valid === true) {
    input.classList.add('input-valid');
    const ok = document.createElement('span');
    ok.className = 'field-ok';
    ok.setAttribute('aria-hidden', 'true');
    ok.textContent = '✓';
    parent.appendChild(ok);
  } else if (valid === false && msg) {
    input.classList.add('input-error');
    const err = document.createElement('p');
    err.className = 'field-error';
    err.setAttribute('role', 'alert');
    err.textContent = msg;
    parent.appendChild(err);
  }
}

function setupRealtimeValidation() {
  // NOME
  const nome = document.getElementById('nome');
  nome.addEventListener('blur', function () {
    const v = this.value.trim();
    if (!v) return setFieldState(this, false, 'Campo obrigatório.');
    if (v.length < 3) return setFieldState(this, false, 'O nome deve ter pelo menos 3 letras.');
    if (v.split(' ').length < 2) return setFieldState(this, false, 'Introduza o nome completo (próprio e apelido).');
    setFieldState(this, true, null);
  });
  nome.addEventListener('input', function () {
    if (this.classList.contains('input-error')) {
      const v = this.value.trim();
      if (v.length >= 3 && v.split(' ').length >= 2) setFieldState(this, true, null);
    }
  });

  // EMAIL
  const email = document.getElementById('email');
  email.addEventListener('blur', function () {
    const v = this.value.trim();
    if (!v) return setFieldState(this, false, 'Campo obrigatório.');
    if (!validarEmail(v)) return setFieldState(this, false, 'Endereço de e-mail inválido.');
    setFieldState(this, true, null);
  });
  email.addEventListener('input', function () {
    if (this.classList.contains('input-error') && validarEmail(this.value.trim())) {
      setFieldState(this, true, null);
    }
  });

  // TELEMÓVEL
  const tel = document.getElementById('telemovel');
  tel.addEventListener('blur', function () {
    const v = this.value.trim();
    if (!v) return setFieldState(this, false, 'Campo obrigatório.');
    if (!validarTelemovel(v)) return setFieldState(this, false, 'Número inválido. Deve começar por 9 e ter 9 dígitos.');
    setFieldState(this, true, null);
  });
  tel.addEventListener('input', function () {
    if (this.classList.contains('input-error') && validarTelemovel(this.value.trim())) {
      setFieldState(this, true, null);
    }
  });

  // NIF (opcional mas se preenchido, valida)
  const nif = document.getElementById('nif');
  nif.addEventListener('blur', function () {
    const v = this.value.trim();
    if (!v) return setFieldState(this, null, null); // opcional
    if (!validarNIF(v)) return setFieldState(this, false, 'NIF inválido.');
    setFieldState(this, true, null);
  });
  nif.addEventListener('input', function () {
    if (this.classList.contains('input-error') && this.value.length === 9 && validarNIF(this.value)) {
      setFieldState(this, true, null);
    }
  });

  // MORADA
  const morada = document.getElementById('morada');
  morada.addEventListener('blur', function () {
    const v = this.value.trim();
    if (!v) return setFieldState(this, false, 'Campo obrigatório.');
    if (v.length < 5) return setFieldState(this, false, 'Introduza a morada completa.');
    setFieldState(this, true, null);
  });

  // CÓDIGO POSTAL
  const cp = document.getElementById('codigo-postal');
  cp.addEventListener('blur', function () {
    const v = this.value.trim();
    if (!v) return setFieldState(this, false, 'Campo obrigatório.');
    if (!validarCodigoPostal(v)) return setFieldState(this, false, 'Formato inválido. Use XXXX-XXX.');
    setFieldState(this, true, null);
  });
  cp.addEventListener('input', function () {
    if (this.classList.contains('input-error') && validarCodigoPostal(this.value)) {
      setFieldState(this, true, null);
    }
  });

  // LOCALIDADE
  const loc = document.getElementById('localidade');
  loc.addEventListener('blur', function () {
    const v = this.value.trim();
    if (!v) return setFieldState(this, false, 'Campo obrigatório.');
    if (v.length < 2) return setFieldState(this, false, 'Introduza a localidade.');
    setFieldState(this, true, null);
  });

  // MBWAY PHONE
  const mbPhone = document.getElementById('mbway-phone');
  mbPhone.addEventListener('blur', function () {
    if (state.paymentMethod !== 'mbway') return;
    const v = this.value.trim();
    if (!v) return setFieldState(this, false, 'Número MB WAY obrigatório.');
    if (!validarTelemovel(v)) return setFieldState(this, false, 'Número inválido. Deve começar por 9 e ter 9 dígitos.');
    setFieldState(this, true, null);
  });
  mbPhone.addEventListener('input', function () {
    if (this.classList.contains('input-error') && validarTelemovel(this.value.trim())) {
      setFieldState(this, true, null);
    }
  });
}

// ============================================================
// APLICAR TODAS AS MÁSCARAS
// ============================================================
function applyMasks() {
  maskPhone(document.getElementById('telemovel'));
  maskPhone(document.getElementById('mbway-phone'));
  maskPostalCode(document.getElementById('codigo-postal'));
  maskNIF(document.getElementById('nif'));
  maskNameField(document.getElementById('nome'));
  maskNameField(document.getElementById('localidade'));
  maskCoupon(document.getElementById('coupon-input'));

  // Limite de caracteres restantes nos campos de texto livre
  const morada = document.getElementById('morada');
  morada.setAttribute('maxlength', '100');

  const morada2 = document.getElementById('morada2');
  morada2.setAttribute('maxlength', '60');

  const nome = document.getElementById('nome');
  nome.setAttribute('maxlength', '80');

  const localidade = document.getElementById('localidade');
  localidade.setAttribute('maxlength', '60');
}

// ============================================================
// CARREGAR DADOS DO SHOPIFY
// ============================================================
function loadCartFromURL() {
  const params = new URLSearchParams(window.location.search);
  
  // Opção 1: Itens via JSON (múltiplos produtos)
  const itemsRaw = params.get('items');
  if (itemsRaw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(itemsRaw));
      state.items = parsed.map(item => ({
        id: item.id || '',
        name: item.name || item.title || 'Produto',
        category: item.category || item.vendor || '',
        meta: item.meta || item.variant || '',
        image: item.image || item.img || '',
        price: parsePrice(item.price),
        quantity: parseInt(item.qty || item.quantity || 1, 10),
      }));
    } catch (e) {
      console.error('Erro ao carregar carrinho via JSON:', e);
    }
  } 
  // Opção 2: Parâmetros simples (um único produto)
  else if (params.get('name')) {
    state.items = [{
      id: params.get('id') || '1',
      name: params.get('name') || 'Produto',
      category: params.get('category') || '',
      meta: params.get('meta') || '',
      image: params.get('img') || params.get('image') || '',
      price: parsePrice(params.get('price')),
      quantity: parseInt(params.get('qty') || 1, 10),
    }];
  }

  // Se carregamos itens, renderizamos logo
  if (state.items.length > 0) {
    renderCart();
    updateTotals();
  }

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CHECKOUT_CART') {
      state.items = (event.data.items || []).map(item => ({
        id: item.id || '',
        name: item.name || item.title || 'Produto',
        category: item.category || item.vendor || '',
        meta: item.meta || item.variant || '',
        image: item.image || item.img || '',
        price: parsePrice(item.price),
        quantity: parseInt(item.qty || item.quantity || 1, 10),
      }));
      renderCart();
      updateTotals();
    }
  });
}

// ============================================================
// DEMO
// ============================================================
function loadDemoItems() {
  if (state.items.length === 0) {
    state.items = [
      {
        id: 'demo-1',
        name: 'Dr. Loosen Wehlener Sonnenuhr Riesling Spätlese 2023, 75CL',
        category: 'VINHO BRANCO',
        meta: 'MOSEL, ALEMANHA',
        image: '',
        price: 30.79,
        quantity: 3,
      },
    ];
  }
}

// ============================================================
// RENDERIZAR CARRINHO
// ============================================================
function renderCart() {
  const container = document.getElementById('cart-items');
  container.innerHTML = '';

  if (state.items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <p>O carrinho está vazio</p>
      </div>`;
    return;
  }

  state.items.forEach((item, idx) => {
    const lineTotal = item.price * item.quantity;
    const imgEl = item.image
      ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="cart-item-img-placeholder" style="display:none"><span>IMG</span></div>`
      : `<div class="cart-item-img-placeholder"><span>IMG</span></div>`;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.idx = idx;
    div.innerHTML = `
      ${imgEl}
      <div class="cart-item-info">
        ${item.category ? `<div class="cart-item-category">${escapeHtml(item.category)}</div>` : ''}
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        ${item.meta ? `<div class="cart-item-meta">${escapeHtml(item.meta)}</div>` : ''}
      </div>
      <div class="cart-item-right">
        <span class="cart-item-price">${formatCurrency(lineTotal)}</span>
        <div class="qty-stepper">
          <button class="qty-btn qty-minus" data-idx="${idx}" aria-label="Diminuir quantidade">−</button>
          <input type="number" class="cart-item-qty" min="1" max="99" value="${item.quantity}" data-idx="${idx}" aria-label="Quantidade" />
          <button class="qty-btn qty-plus" data-idx="${idx}" aria-label="Aumentar quantidade">+</button>
        </div>
        <button class="btn-remove-item" data-idx="${idx}" title="Remover artigo">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
    container.appendChild(div);
  });

  container.querySelectorAll('.cart-item-qty').forEach(input => {
    input.addEventListener('change', onQtyChange);
    input.addEventListener('input', function () {
      let v = parseInt(this.value, 10);
      if (isNaN(v) || v < 1) this.value = 1;
      if (v > 99) this.value = 99;
    });
  });

  container.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', function () {
      const idx = parseInt(this.dataset.idx, 10);
      if (state.items[idx].quantity > 1) {
        state.items[idx].quantity--;
        renderCart();
        updateTotals();
      }
    });
  });

  container.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', function () {
      const idx = parseInt(this.dataset.idx, 10);
      if (state.items[idx].quantity < 99) {
        state.items[idx].quantity++;
        renderCart();
        updateTotals();
      }
    });
  });

  container.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', onRemoveItem);
  });
}

function onQtyChange(e) {
  const idx = parseInt(e.target.dataset.idx, 10);
  let newQty = parseInt(e.target.value, 10);
  if (isNaN(newQty) || newQty < 1) newQty = 1;
  if (newQty > 99) newQty = 99;
  e.target.value = newQty;
  state.items[idx].quantity = newQty;
  updateTotals();
  const priceEl = e.target.closest('.cart-item')?.querySelector('.cart-item-price');
  if (priceEl) priceEl.textContent = formatCurrency(state.items[idx].price * newQty);
}

function onRemoveItem(e) {
  const idx = parseInt(e.currentTarget.dataset.idx, 10);
  state.items.splice(idx, 1);
  renderCart();
  updateTotals();
}

// ============================================================
// TOTAIS
// ============================================================
function getSubtotal() {
  return state.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
}

function getShipping() {
  if (state.shippingMethod === 'express') return 8.99;
  return getSubtotal() >= 70 ? 0 : 4.99;
}

function getTotal() {
  return Math.max(0, getSubtotal() - state.couponDiscount + getShipping());
}

function updateTotals() {
  const sub = getSubtotal();
  const ship = getShipping();
  const total = getTotal();

  document.getElementById('subtotal-value').textContent = formatCurrency(sub);
  document.getElementById('cart-total-display').textContent = formatCurrency(sub);
  document.getElementById('shipping-total-display').textContent = ship === 0 ? '0,00\u00a0\u20ac' : formatCurrency(ship);
  document.getElementById('order-total-display').textContent = formatCurrency(total);

  // Info dinâmica de envio grátis
  const shippingNote = document.getElementById('shipping-note');
  if (shippingNote) {
    if (state.shippingMethod === 'normal' && sub < 70 && sub > 0) {
      const falta = 70 - sub;
      shippingNote.textContent = `Faltam ${formatCurrency(falta)} para envio grátis.`;
      shippingNote.style.display = 'block';
    } else {
      shippingNote.style.display = 'none';
    }
  }
}

// ============================================================
// UPDATE CART
// ============================================================
document.getElementById('btn-update-cart').addEventListener('click', () => {
  renderCart();
  updateTotals();
  const btn = document.getElementById('btn-update-cart');
  const original = btn.textContent;
  btn.textContent = 'ACTUALIZADO ✓';
  btn.style.background = '#4a9a5a';
  setTimeout(() => {
    btn.textContent = original;
    btn.style.background = '';
  }, 1800);
});

// ============================================================
// CUPÃO
// ============================================================
document.getElementById('btn-apply-coupon').addEventListener('click', () => {
  const code = document.getElementById('coupon-input').value.trim().toUpperCase();
  if (!code) return showCouponMsg('Introduza um código de cupão.', false);

  const coupons = {
    'DESCONTO10': { type: 'percent', value: 10 },
    'MENOS5': { type: 'fixed', value: 5 },
  };

  if (coupons[code]) {
    const c = coupons[code];
    const sub = getSubtotal();
    state.couponDiscount = c.type === 'percent' ? (sub * c.value / 100) : c.value;
    showCouponMsg(`Cupão aplicado! Desconto de ${formatCurrency(state.couponDiscount)}.`, true);
  } else {
    state.couponDiscount = 0;
    showCouponMsg('Código de cupão inválido ou expirado.', false);
  }
  updateTotals();
});

// Permitir Enter no campo de cupão
document.getElementById('coupon-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') document.getElementById('btn-apply-coupon').click();
});

function showCouponMsg(msg, success) {
  let el = document.getElementById('coupon-msg');
  if (!el) {
    el = document.createElement('p');
    el.id = 'coupon-msg';
    el.style.cssText = 'font-size:11px; margin: 4px 16px 0; line-height:1.4;';
    document.querySelector('.coupon-row').after(el);
  }
  el.textContent = msg;
  el.style.color = success ? '#4a9a5a' : '#c0392b';
}

// ============================================================
// ENTREGA
// ============================================================
document.querySelectorAll('input[name="delivery"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    state.shippingMethod = e.target.value;
    updateTotals();
  });
});

// ============================================================
// PAGAMENTO
// ============================================================
document.querySelectorAll('input[name="payment"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    state.paymentMethod = e.target.value;
    const mbwayGroup = document.getElementById('mbway-phone-group');
    const multibancoInfo = document.getElementById('multibanco-info');

    if (e.target.value === 'mbway') {
      mbwayGroup.style.display = 'block';
      multibancoInfo.style.display = 'none';
      setTimeout(() => document.getElementById('mbway-phone').focus(), 50);
    } else {
      mbwayGroup.style.display = 'none';
      multibancoInfo.style.display = e.target.value === 'multibanco' ? 'block' : 'none';
    }
  });
});

// Estado inicial
document.getElementById('multibanco-info').style.display = 'block';
document.getElementById('mbway-phone-group').style.display = 'none';

// ============================================================
// VALIDAÇÃO FINAL DO FORMULÁRIO
// ============================================================
function validateForm() {
  // Limpar erros anteriores
  document.querySelectorAll('.input-error').forEach(el => {
    el.classList.remove('input-error');
  });
  document.querySelectorAll('.field-error').forEach(el => el.remove());
  document.querySelectorAll('.field-ok').forEach(el => el.remove());
  document.querySelectorAll('.input-valid').forEach(el => el.classList.remove('input-valid'));

  const errors = [];

  function addError(id, msg) {
    errors.push(msg);
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('input-error');
    const parent = el.closest('.form-group') || el.parentNode;
    const p = document.createElement('p');
    p.className = 'field-error';
    p.setAttribute('role', 'alert');
    p.textContent = msg;
    parent.appendChild(p);
  }

  // Nome
  const nome = document.getElementById('nome').value.trim();
  if (!nome) addError('nome', 'Campo obrigatório.');
  else if (nome.length < 3) addError('nome', 'O nome deve ter pelo menos 3 letras.');
  else if (nome.split(' ').filter(p => p.length > 0).length < 2) addError('nome', 'Introduza o nome completo (próprio e apelido).');

  // Email
  const email = document.getElementById('email').value.trim();
  if (!email) addError('email', 'Campo obrigatório.');
  else if (!validarEmail(email)) addError('email', 'Endereço de e-mail inválido.');

  // Telemóvel
  const tel = document.getElementById('telemovel').value.trim();
  if (!tel) addError('telemovel', 'Campo obrigatório.');
  else if (!validarTelemovel(tel)) addError('telemovel', 'Número inválido. Deve começar por 9 e ter 9 dígitos.');

  // NIF (opcional)
  const nif = document.getElementById('nif').value.trim();
  if (nif && !validarNIF(nif)) addError('nif', 'NIF inválido.');

  // Morada
  const morada = document.getElementById('morada').value.trim();
  if (!morada) addError('morada', 'Campo obrigatório.');
  else if (morada.length < 5) addError('morada', 'Introduza a morada completa.');

  // Código Postal
  const cp = document.getElementById('codigo-postal').value.trim();
  if (!cp) addError('codigo-postal', 'Campo obrigatório.');
  else if (!validarCodigoPostal(cp)) addError('codigo-postal', 'Formato inválido. Use XXXX-XXX.');

  // Localidade
  const loc = document.getElementById('localidade').value.trim();
  if (!loc) addError('localidade', 'Campo obrigatório.');
  else if (loc.length < 2) addError('localidade', 'Introduza a localidade.');

  // MB WAY phone
  if (state.paymentMethod === 'mbway') {
    const mbPhone = document.getElementById('mbway-phone').value.trim();
    if (!mbPhone) addError('mbway-phone', 'Número MB WAY obrigatório.');
    else if (!validarTelemovel(mbPhone)) addError('mbway-phone', 'Número inválido. Deve começar por 9.');
  }

  // Termos
  if (!document.getElementById('terms-check').checked) {
    errors.push('termos');
    const termsRow = document.querySelector('.terms-row');
    termsRow.classList.add('terms-error');
    setTimeout(() => termsRow.classList.remove('terms-error'), 3000);
  }

  // Carrinho vazio
  if (state.items.length === 0) {
    errors.push('O carrinho está vazio.');
  }

  return errors;
}

// ============================================================
// RECOLHER DADOS
// ============================================================
function collectOrderData() {
  return {
    customer: {
      name: document.getElementById('nome').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('telemovel').value.trim(),
      nif: document.getElementById('nif').value.trim(),
      country: document.getElementById('pais').value,
      address: document.getElementById('morada').value.trim(),
      address2: document.getElementById('morada2').value.trim(),
      postalCode: document.getElementById('codigo-postal').value.trim(),
      city: document.getElementById('localidade').value.trim(),
    },
    items: state.items,
    shipping: { method: state.shippingMethod, cost: getShipping() },
    payment: {
      method: state.paymentMethod,
      mbwayPhone: state.paymentMethod === 'mbway'
        ? document.getElementById('mbway-phone').value.trim()
        : null,
    },
    totals: {
      subtotal: getSubtotal(),
      shipping: getShipping(),
      discount: state.couponDiscount,
      total: getTotal(),
    },
    orderRef: 'ORD-' + Date.now(),
  };
}

// ============================================================
// FINALIZAR
// ============================================================
document.getElementById('btn-finalizar').addEventListener('click', async () => {
  console.log('[DEBUG] Botão Finalizar clicado');
  const errors = validateForm();
  console.log('[DEBUG] Erros de validação:', errors);

  if (errors.length > 0) {
    console.log('[DEBUG] Formulário inválido, erros:', errors);
    const firstErrorEl = document.querySelector('.input-error');
    if (firstErrorEl) {
      firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstErrorEl.focus();
    } else if (errors.includes('termos')) {
      document.querySelector('.terms-row').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (errors.some(e => e.includes('vazio'))) {
      showToast('O carrinho está vazio. Adicione artigos antes de finalizar.', 'error');
    }
    return;
  }

  console.log('[DEBUG] Formulário válido, a processar pagamento...');
  const orderData = collectOrderData();
  console.log('[DEBUG] Dados do pedido:', orderData);
  document.getElementById('loading-overlay').style.display = 'flex';

  try {
    const result = await processPayment(orderData);
    console.log('[DEBUG] Resultado do pagamento:', result);
    document.getElementById('loading-overlay').style.display = 'none';

    // Disparar evento UTMify: Purchase
    utmifyEvent('Purchase', {
      value:         result.amount,
      currency:      'EUR',
      transactionId: result.transactionID || '',
    });

    showPaymentResult(result, orderData);
  } catch (err) {
    console.error('[DEBUG] Erro no pagamento:', err.message);
    document.getElementById('loading-overlay').style.display = 'none';
    showToast('Erro ao processar pagamento: ' + err.message, 'error');
  }
});

// ============================================================
// PROCESSAR PAGAMENTO — WayMB API
// ============================================================
async function processPayment(orderData) {
  const loadingText = document.querySelector('.loading-text');
  if (loadingText) loadingText.textContent = 'A processar pagamento...';

  // Normalizar número de telefone (remover espaços)
  const phoneRaw = orderData.customer.phone.replace(/\s/g, '');
  const mbwayPhoneRaw = orderData.payment.mbwayPhone
    ? orderData.payment.mbwayPhone.replace(/\s/g, '')
    : phoneRaw;

  // Usar número MBWAY para pagamentos MB WAY, número geral para os outros
  const payerPhone = orderData.payment.method === 'mbway' ? mbwayPhoneRaw : phoneRaw;

  const payload = {
    amount: orderData.totals.total,
    method: orderData.payment.method,
    payerName: orderData.customer.name,
    payerEmail: orderData.customer.email,
    payerPhone: payerPhone,
    payerDocument: orderData.customer.nif || '',
  };

  const response = await fetch('/api/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.details?.message || data?.error || 'Erro desconhecido.';
    throw new Error(errMsg);
  }

  // Construir resultado normalizado para o modal
  const result = {
    success: true,
    method: data.method || orderData.payment.method,
    transactionID: data.transactionID,
    amount: data.amount || orderData.totals.total,
    phone: payerPhone,
    generatedMBWay: data.generatedMBWay || false,
  };

  // Dados Multibanco (se existirem)
  if (data.referenceData) {
    result.entity = data.referenceData.entity;
    result.reference = data.referenceData.reference;
    result.expiresAt = data.referenceData.expiresAt
      ? new Date(data.referenceData.expiresAt).toLocaleDateString('pt-PT')
      : null;
  }

  return result;
}

// ============================================================
// MODAL DE SUCESSO
// ============================================================
// MOSTRAR RESULTADO DO PAGAMENTO (inline, na página)
// ============================================================
function showPaymentResult(result, orderData) {
  // Esconder o formulário e o botão finalizar
  document.getElementById('main-checkout').querySelector('.checkout-grid').style.display = 'none';
  document.getElementById('finalizar-row').style.display = 'none';

  const section   = document.getElementById('payment-result');
  const dataGrid  = document.getElementById('pr-data-grid');
  const subtitle  = document.getElementById('pr-subtitle');
  const note      = document.getElementById('pr-note');

  dataGrid.innerHTML = '';

  // ---- Função auxiliar: criar linha copiável ----
  function makeRow(label, value, highlight) {
    const row = document.createElement('div');
    row.className = 'pr-row' + (highlight ? ' pr-row--highlight' : '');

    row.innerHTML = `
      <span class="pr-row-label">${label}</span>
      <span class="pr-row-value" id="prval-${label.toLowerCase().replace(/\s/g,'-')}">${escapeHtml(String(value))}</span>
      <button class="btn-copy" data-copy="${escapeHtml(String(value))}" aria-label="Copiar ${label}" title="Copiar">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    `;
    return row;
  }

  if (result.method === 'multibanco') {
    subtitle.textContent = 'Utilize os dados abaixo para efectuar o pagamento numa caixa Multibanco ou no seu banco online.';
    note.textContent = '⏳ A referência só fica activa alguns minutos após a geração. Caso expire, realize uma nova encomenda.';

    dataGrid.appendChild(makeRow('Entidade',   result.entity    || '—', false));
    dataGrid.appendChild(makeRow('Referência', result.reference || '—', true));
    dataGrid.appendChild(makeRow('Valor',      formatCurrency(result.amount), false));
    if (result.expiresAt) {
      dataGrid.appendChild(makeRow('Válido até', result.expiresAt, false));
    }
    if (result.transactionID) {
      dataGrid.appendChild(makeRow('ID Transação', result.transactionID, false));
    }

  } else if (result.method === 'mbway') {
    const mbwayOk = result.generatedMBWay;
    subtitle.textContent = mbwayOk
      ? `Foi enviada uma notificação para ${result.phone} via MB WAY. Abra a app e confirme o pagamento.`
      : `Pedido MB WAY enviado para ${result.phone}. Verifique a sua app MB WAY.`;
    note.textContent = '📱 Após confirmar na app MB WAY, o pagamento ficará registado automaticamente.';

    dataGrid.appendChild(makeRow('Número MB WAY', result.phone, true));
    dataGrid.appendChild(makeRow('Valor',         formatCurrency(result.amount), false));
    if (result.transactionID) {
      dataGrid.appendChild(makeRow('ID Transação', result.transactionID, false));
    }

  } else {
    subtitle.textContent = 'A sua encomenda foi recebida com sucesso!';
    note.textContent = '';
    dataGrid.appendChild(makeRow('Referência', orderData.orderRef, false));
  }

  // Activar botões de copiar
  dataGrid.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', function () {
      const text = this.dataset.copy;
      navigator.clipboard.writeText(text).then(() => {
        const original = this.innerHTML;
        this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        this.style.color = '#2e7d32';
        setTimeout(() => { this.innerHTML = original; this.style.color = ''; }, 1800);
      });
    });
  });

  // Mostrar a secção
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Botão "Nova Encomenda" — recarrega a página
document.getElementById('btn-pr-back').addEventListener('click', () => {
  window.location.reload();
});

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(msg, type = 'info') {
  const existing = document.getElementById('toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('toast-visible'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ============================================================
// MOBILE: ACCORDION para colunas em mobile
// ============================================================
function setupMobileAccordion() {
  if (window.innerWidth > 768) return;

  const cols = document.querySelectorAll('.checkout-col');
  cols.forEach((col, i) => {
    const header = col.querySelector('.col-header');
    const inner = col.querySelector('.col-inner');
    if (!header || !inner) return;

    // Primeira coluna aberta por padrão
    if (i === 0) {
      col.classList.add('col-open');
    } else {
      col.classList.remove('col-open');
    }

    header.style.cursor = 'pointer';
    header.addEventListener('click', () => {
      const isOpen = col.classList.contains('col-open');
      // Fechar todos
      cols.forEach(c => c.classList.remove('col-open'));
      if (!isOpen) col.classList.add('col-open');
    });
  });
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
function init() {
  loadCartFromURL();
  // loadDemoItems(); // Removido para não mostrar produtos de teste
  renderCart();
  updateTotals();
  applyMasks();
  setupRealtimeValidation();

  // Nota de envio grátis dinâmica
  const shippingNote = document.createElement('p');
  shippingNote.id = 'shipping-note';
  shippingNote.className = 'shipping-free-note';
  shippingNote.style.display = 'none';
  const couponRow = document.querySelector('.coupon-row');
  if (couponRow) couponRow.before(shippingNote);

  // Accordion mobile
  setupMobileAccordion();
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      document.querySelectorAll('.checkout-col').forEach(c => c.classList.remove('col-open'));
    }
  });

  // Disparar evento UTMify: InitiateCheckout quando a página carrega com itens
  if (state.items.length > 0) {
    utmifyEvent('InitiateCheckout', {
      value: getTotalAmount(),
      currency: 'EUR',
      items: state.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity }))
    });
  }
}

document.addEventListener('DOMContentLoaded', init);

// ============================================================
// UTMIFY — Helper de eventos
// ============================================================
function getTotalAmount() {
  return state.items.reduce((s, i) => s + i.price * i.quantity, 0);
}

function utmifyEvent(eventName, data) {
  // Aguarda o pixel estar carregado antes de disparar o evento
  function dispatch() {
    try {
      if (typeof window.utmify === 'function') {
        window.utmify(eventName, data);
        console.log('[UTMify] Evento disparado:', eventName, data);
      } else {
        console.log('[UTMify] Pixel não carregado, evento ignorado:', eventName);
      }
    } catch(e) {
      console.warn('[UTMify] Erro ao disparar evento:', e);
    }
  }

  // O pixel pode demorar a carregar, aguardamos até 500ms
  if (typeof window.utmify === 'function') {
    dispatch();
  } else {
    setTimeout(dispatch, 500);
  }
}
