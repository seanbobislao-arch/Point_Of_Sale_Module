let cart = [];
let posCategory = 'food';
let selectedPayment = 'Cash';

function findCartItem(id){
  return arrayFind(cart, function(c){ return c.id === id; });
}

function addToCart(id){
  const product = arrayFind(DATA.products, function(p){ return p.id === id; });
  if(!product) return;
  const inCart = findCartItem(id);
  const currentQty = inCart ? inCart.qty : 0;
  if(currentQty + 1 > getStock(id)){
    showToast(product.name + ' has no more stock available.', true);
    return;
  }
  if(inCart){
    inCart.qty = inCart.qty + 1;
  } else {
    arrayAppend(cart, { id: id, name: product.name, price: product.price, qty: 1 });
  }
  renderCart();
}

function changeQty(id, delta){
  const item = findCartItem(id);
  if(!item) return;
  if(delta > 0 && item.qty + 1 > getStock(id)){
    showToast('No more stock available.', true);
    return;
  }
  item.qty = item.qty + delta;
  if(item.qty <= 0){
    arrayRemoveMatching(cart, function(c){ return c.id === id; });
  }
  renderCart();
}

function computeDiscount(subtotal){
  const type = document.getElementById('discountType').value;
  const val = parseFloat(document.getElementById('discountValue').value) || 0;
  if(type === 'none') return 0;
  if(type === 'percent') return subtotal * (Math.min(val, 100) / 100);
  if(type === 'senior') return subtotal * 0.20;
  if(type === 'amount') return Math.min(val, subtotal);
  return 0;
}

function recalcSummary(){
  const subtotal = arraySum(cart, function(i){ return i.price * i.qty; });
  const discount = computeDiscount(subtotal);
  const total = Math.max(subtotal - discount, 0);
  document.getElementById('sumSubtotal').textContent = fmt(subtotal);
  document.getElementById('sumDiscount').textContent = '-' + fmt(discount);
  document.getElementById('sumTotal').textContent = fmt(total);
}

function renderPOS(){
  const q = document.getElementById('posSearch').value;
  const items = searchProducts(q, posCategory);

  const grid = document.getElementById('posGrid');
  if(items.length === 0){
    grid.innerHTML = '<div class="cart-empty">No products match.</div>';
  } else {
    let html = '';
    for(let i = 0; i < items.length; i++){
      const p = items[i];
      const stock = getStock(p.id);
      const low = isLowStock(p.id);
      const oos = stock <= 0;
      html += '<button class="product-card ' + (oos ? 'oos' : '') + '" data-id="' + p.id + '" ' + (oos ? 'disabled' : '') + '>' +
        '<span class="pcat">' + typeLabel(p.type) + '</span>' +
        '<span class="pname">' + p.name + '</span>' +
        '<span class="pprice">' + fmt(p.price) + '</span>' +
        '<span class="pstock ' + (low ? 'low' : '') + '">' + (oos ? 'Out of stock' : stock + ' in stock') + '</span></button>';
    }
    grid.innerHTML = html;
  }

  const cards = grid.querySelectorAll('.product-card');
  for(let i = 0; i < cards.length; i++){
    const card = cards[i];
    card.addEventListener('click', function(){ addToCart(card.dataset.id); });
  }
  renderCart();
}

function renderCart(){
  const wrap = document.getElementById('cartItems');
  if(cart.length === 0){
    wrap.innerHTML = '<div class="cart-empty">Cart is empty.<br>Tap a product to begin an order.</div>';
  } else {
    let html = '';
    for(let i = 0; i < cart.length; i++){
      const item = cart[i];
      html += '<div class="cart-item" data-id="' + item.id + '">' +
        '<div class="ci-name">' + item.name + '<small>' + fmt(item.price) + ' each</small></div>' +
        '<div class="qty-stepper"><button data-act="dec">−</button><span>' + item.qty + '</span><button data-act="inc">+</button></div>' +
        '<div class="ci-total">' + fmt(item.price * item.qty) + '</div></div>';
    }
    wrap.innerHTML = html;
  }

  const rows = wrap.querySelectorAll('.cart-item');
  for(let i = 0; i < rows.length; i++){
    const row = rows[i];
    const id = row.dataset.id;
    row.querySelector('[data-act="inc"]').addEventListener('click', function(){ changeQty(id, 1); });
    row.querySelector('[data-act="dec"]').addEventListener('click', function(){ changeQty(id, -1); });
  }
  recalcSummary();
}

function processCheckout(){
  if(cart.length === 0){
    showToast('Add at least one item first.', true);
    return;
  }
  for(let i = 0; i < cart.length; i++){
    const item = cart[i];
    const product = arrayFind(DATA.products, function(p){ return p.id === item.id; });
    if(!product || item.qty > getStock(item.id)){
      showToast(item.name + ' no longer has enough stock.', true);
      renderPOS();
      return;
    }
  }

  const subtotal = arraySum(cart, function(i){ return i.price * i.qty; });
  const discount = computeDiscount(subtotal);
  const total = Math.max(subtotal - discount, 0);
  const discountType = document.getElementById('discountType').value;

  for(let i = 0; i < cart.length; i++){
    const item = cart[i];
    const rec = getInventoryRecord(item.id);
    if(rec) rec.stock = rec.stock - item.qty;
  }

  const receiptItems = [];
  for(let i = 0; i < cart.length; i++){
    const it = cart[i];
    arrayAppend(receiptItems, { id: it.id, name: it.name, price: it.price, qty: it.qty });
  }

  
  const tx = {
    id: 'tx' + Date.now(),
    receiptNo: 'RCPT-' + DATA.nextTxSeq,
    dateISO: new Date().toISOString(),
    items: receiptItems,
    subtotal: subtotal,
    discount: discount,
    discountType: discountType,
    total: total,
    payment: selectedPayment,
    status: 'completed'
  };
  DATA.nextTxSeq = DATA.nextTxSeq + 1;
  arrayAppend(DATA.transactions, tx);
  saveData();

  showReceipt(tx);
  cart = [];
  document.getElementById('discountType').value = 'none';
  document.getElementById('discountValue').value = '';
  document.getElementById('discountValue').disabled = true;
  renderPOS();
}

function initPosModule(){
  const catTabs = document.getElementById('posCatTabs');
  catTabs.addEventListener('click', function(e){
    const btn = e.target.closest('.pill-tab');
    if(!btn) return;
    posCategory = btn.dataset.cat;
    const tabs = catTabs.querySelectorAll('.pill-tab');
    for(let i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i] === btn);
    renderPOS();
  });

  
  document.getElementById('posSearch').addEventListener('input', renderPOS);

  document.getElementById('clearCartBtn').addEventListener('click', function(){ cart = []; renderCart(); });

  document.getElementById('discountType').addEventListener('change', function(e){
    const val = e.target.value;
    const input = document.getElementById('discountValue');
    input.disabled = (val === 'none' || val === 'senior');
    input.value = val === 'senior' ? 20 : (val === 'none' ? '' : input.value);
    recalcSummary();
  });
  document.getElementById('discountValue').addEventListener('input', recalcSummary);

  const payButtons = document.querySelectorAll('.pay-method');
  for(let i = 0; i < payButtons.length; i++){
    const btn = payButtons[i];
    btn.addEventListener('click', function(){
      for(let j = 0; j < payButtons.length; j++) payButtons[j].classList.remove('active');
      btn.classList.add('active');
      selectedPayment = btn.dataset.pay;
    });
  }

  document.getElementById('checkoutBtn').addEventListener('click', processCheckout);
  document.getElementById('newOrderBtn').addEventListener('click', function(){
    closeModal('receiptModal');
  });
}
