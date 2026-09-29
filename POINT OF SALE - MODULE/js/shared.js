function arrayAppend(arr, item){
  arr[arr.length] = item;
  return arr;
}

function arrayRemoveMatching(arr, matchFn){
  let writeIndex = 0;
  for(let i = 0; i < arr.length; i++){
    if(!matchFn(arr[i])){
      arr[writeIndex] = arr[i];
      writeIndex = writeIndex + 1;
    }
  }
  arr.length = writeIndex;
  return arr;
}

function arrayFind(arr, matchFn){
  for(let i = 0; i < arr.length; i++){
    if(matchFn(arr[i])) return arr[i];
  }
  return null;
}

function arrayFilter(arr, matchFn){
  const result = [];
  for(let i = 0; i < arr.length; i++){
    if(matchFn(arr[i])) arrayAppend(result, arr[i]);
  }
  return result;
}

function arraySum(arr, valueFn){
  let total = 0;
  for(let i = 0; i < arr.length; i++){
    total = total + valueFn(arr[i]);
  }
  return total;
}

const STORAGE_KEY = 'matcha_pos_data_v3';
const SESSION_KEY = 'matcha_pos_session_v1';

const LOW_STOCK_THRESHOLD = 5;

function buildSeedData(){
  const users = [
    { username: 'admin',   password: 'admin123',   role: 'admin',   idNumber: '100001' },
    { username: 'cashier', password: 'cashier123', role: 'cashier', idNumber: '200002' }
  ];

  const products = [
    { id: 'p1', name: 'Matcha Latte',            category: 'food', type: 'regular',  price: 150 },
    { id: 'p2', name: 'Iced Houjicha',           category: 'food', type: 'regular',  price: 140 },
    { id: 'p3', name: 'Cheese Tart',             category: 'food', type: 'regular',  price: 95  },
    { id: 'p4', name: 'Nachos Platter',          category: 'food', type: 'regular',  price: 220 },
    { id: 'p5', name: 'Pumpkin Spice Matcha',    category: 'food', type: 'seasonal', price: 170 },
    { id: 'p6', name: 'Halo-Halo Special',       category: 'food', type: 'limited',  price: 160 },
    { id: 'p7', name: 'Sparkling Calamansi',     category: 'food', type: 'regular',  price: 120 },
    { id: 'p8', name: 'Garlic Bread Board',      category: 'food', type: 'regular',  price: 110 },
    { id: 'g1', name: 'Catan',                   category: 'game', type: 'regular',  price: 80  },
    { id: 'g2', name: 'Uno',                     category: 'game', type: 'regular',  price: 40  },
    { id: 'g3', name: 'Codenames',               category: 'game', type: 'regular',  price: 70  },
    { id: 'g4', name: 'Exploding Kittens',       category: 'game', type: 'regular',  price: 60  },
    { id: 'g5', name: 'Halloween Werewolf Deck', category: 'game', type: 'seasonal', price: 65  },
    { id: 'g6', name: 'Anniversary Tarot Deck',  category: 'game', type: 'limited',  price: 90  },
    { id: 'g7', name: 'Jenga',                   category: 'game', type: 'regular',  price: 50  }
  ];

  
  const inventory = [
    { productId: 'p1', stock: 10 },
    { productId: 'p2', stock: 0  },
    { productId: 'p3', stock: 1  },
    { productId: 'p4', stock: 10 },
    { productId: 'p5', stock: 8  },
    { productId: 'p6', stock: 8  },
    { productId: 'p7', stock: 0  },
    { productId: 'p8', stock: 0  },
    { productId: 'g1', stock: 12 },
    { productId: 'g2', stock: 3  },
    { productId: 'g3', stock: 0  },
    { productId: 'g4', stock: 15 },
    { productId: 'g5', stock: 4  },
    { productId: 'g6', stock: 6  },
    { productId: 'g7', stock: 0  }
  ];

  const transactions = [];

  return {
    users: users,
    products: products,
    inventory: inventory,
    transactions: transactions,
    nextTxSeq: 1001
  };
}

function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){
    const seeded = buildSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try{
    return JSON.parse(raw);
  }catch(e){
    const seeded = buildSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA));
}

function restockAllTo(units){
  for(let i = 0; i < DATA.inventory.length; i++){
    DATA.inventory[i].stock = units;
  }
  saveData();
}

let DATA = loadData();

function getInventoryRecord(productId){
  return arrayFind(DATA.inventory, function(r){ return r.productId === productId; });
}

function getStock(productId){
  const r = getInventoryRecord(productId);
  return r ? r.stock : 0;
}

function isLowStock(productId){
  const stock = getStock(productId);
  return stock > 0 && stock < LOW_STOCK_THRESHOLD;
}

function fmt(n){
  return '₱' + Number(n).toFixed(2);
}

function niceDateTime(iso){
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function typeLabel(t){
  if(t === 'regular') return 'Regular';
  if(t === 'seasonal') return 'Seasonal';
  return 'Limited-time';
}

let toastTimer = null;

function showToast(message, isError){
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 2600);
}

function openModal(id){
  document.getElementById(id).classList.add('active');
}

function closeModal(id){
  document.getElementById(id).classList.remove('active');
}

function initUiModule(){
  const closeButtons = document.querySelectorAll('[data-close]');
  for(let i = 0; i < closeButtons.length; i++){
    const btn = closeButtons[i];
    btn.addEventListener('click', function(){ closeModal(btn.dataset.close); });
  }

  const backdrops = document.querySelectorAll('.modal-backdrop');
  for(let i = 0; i < backdrops.length; i++){
    const bd = backdrops[i];
    bd.addEventListener('click', function(e){
      if(e.target === bd) bd.classList.remove('active');
    });
  }
}

let SESSION = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');

function findUserByCredentials(username, password){
  return arrayFind(DATA.users, function(u){
    return u.username.toLowerCase() === username.toLowerCase() && u.password === password;
  });
}

function findUserByUsername(username){
  return arrayFind(DATA.users, function(u){
    return u.username.toLowerCase() === username.toLowerCase();
  });
}

function processLogin(username, password){
  if(!findUserByUsername(username)){
    return { ok: false, message: 'Username not found.' };
  }
  const user = findUserByCredentials(username, password);
  if(!user){
    return { ok: false, message: 'Incorrect password.' };
  }
  SESSION = { username: user.username, role: user.role };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
  return { ok: true };
}

function processLogout(){
  SESSION = null;
  sessionStorage.removeItem(SESSION_KEY);
}

function enterApp(){
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').classList.add('active');
  document.getElementById('userLabel').textContent = SESSION.username + ' · ' + SESSION.role;
  document.getElementById('userAvatar').textContent = SESSION.username[0].toUpperCase();
  renderPOS();
}

function initAuthModule(){
  const loginForm = document.getElementById('loginForm');

  const pwToggles = document.querySelectorAll('.pw-toggle');
  for(let i = 0; i < pwToggles.length; i++){
    const btn = pwToggles[i];
    btn.addEventListener('click', function(){
      const target = document.getElementById(btn.getAttribute('data-target'));
      if(!target) return;
      const isHidden = target.type === 'password';
      target.type = isHidden ? 'text' : 'password';
      btn.textContent = isHidden ? 'Hide' : 'Show';
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  }

  loginForm.addEventListener('submit', function(e){
    e.preventDefault();
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;
    const errEl = document.getElementById('loginError');

    const result = processLogin(username, password);
    if(!result.ok){
      errEl.textContent = result.message;
      return;
    }
    errEl.textContent = '';
    enterApp();
    showToast('Logged in as ' + SESSION.username + '.');
  });

  document.getElementById('logoutBtn').addEventListener('click', function(){
    processLogout();
    document.getElementById('app').classList.remove('active');
    document.getElementById('loginScreen').style.display = 'flex';
    loginForm.reset();
  });
}

function initResetModule(){
  document.getElementById('resetDataBtn').addEventListener('click', function(){
    restockAllTo(10);
    renderPOS();
    showToast('All products restocked to 10 units.');
  });
}

function initApp(){
  initUiModule();
  initAuthModule();
  initResetModule();
  initReceiptModule();
  initPosModule();

  if(SESSION){ enterApp(); }
}

document.addEventListener('DOMContentLoaded', initApp);
