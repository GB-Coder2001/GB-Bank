// GB Bank — frontend logic
// Talks to the Spring Boot backend at /api/accounts (same origin, served
// as a static resource by Spring Boot, so no CORS setup is needed).

const API_BASE = '/api/accounts';

const ledgerBody   = document.getElementById('ledgerBody');
const ledgerEmpty  = document.getElementById('ledgerEmpty');
const acctCount    = document.getElementById('acctCount');
const toastEl      = document.getElementById('toast');

const createForm     = document.getElementById('createForm');
const holderNameInput= document.getElementById('holderName');
const openingBalance = document.getElementById('openingBalance');

const lookupForm  = document.getElementById('lookupForm');
const lookupId    = document.getElementById('lookupId');
const clearLookup = document.getElementById('clearLookup');
const refreshBtn  = document.getElementById('refreshBtn');

// Amount modal (deposit / withdraw)
const amountModalBackdrop = document.getElementById('amountModalBackdrop');
const amountModalTitle    = document.getElementById('amountModalTitle');
const amountModalSub      = document.getElementById('amountModalSub');
const amountInput         = document.getElementById('amountInput');
const amountModalError    = document.getElementById('amountModalError');
const amountCancel        = document.getElementById('amountCancel');
const amountConfirm       = document.getElementById('amountConfirm');
const modalStampRing      = document.getElementById('modalStampRing');

// Delete modal
const deleteModalBackdrop = document.getElementById('deleteModalBackdrop');
const deleteModalSub      = document.getElementById('deleteModalSub');
const deleteCancel        = document.getElementById('deleteCancel');
const deleteConfirm       = document.getElementById('deleteConfirm');

let pendingAction = null; // { type: 'deposit'|'withdraw', id } or { type:'delete', id }

// ---------- helpers ----------

function formatMoney(value){
  const n = Number(value) || 0;
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showToast(message, isError){
  toastEl.textContent = message;
  toastEl.classList.toggle('toast-error', !!isError);
  toastEl.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.add('hidden'), 3200);
}

async function apiRequest(path, options){
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  let data = null;
  const text = await res.text();
  if (text){
    try { data = JSON.parse(text); } catch(e){ data = text; }
  }
  if (!res.ok){
    const message = (data && data.message) ? data.message : (typeof data === 'string' ? data : 'Request failed (' + res.status + ')');
    throw new Error(message);
  }
  return data;
}

function updateClock(){
  const el = document.getElementById('liveClock');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) +
    '  ·  ' + now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}
updateClock();
setInterval(updateClock, 30000);

// ---------- rendering ----------

function renderAccounts(accounts){
  ledgerBody.innerHTML = '';

  if (!accounts || accounts.length === 0){
    ledgerEmpty.classList.remove('hidden');
    acctCount.textContent = '0 accounts';
    return;
  }
  ledgerEmpty.classList.add('hidden');
  acctCount.textContent = accounts.length + (accounts.length === 1 ? ' account' : ' accounts');

  accounts.forEach(acc => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td><span class="id-chip">#${acc.id}</span></td>
      <td class="holder-name">${escapeHtml(acc.accountHolderName)}</td>
      <td class="balance-amt">${formatMoney(acc.balance)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-secondary btn-small" data-action="deposit" data-id="${acc.id}">Deposit</button>
          <button class="btn btn-ghost btn-small" data-action="withdraw" data-id="${acc.id}">Withdraw</button>
          <button class="btn btn-danger btn-small" data-action="delete" data-id="${acc.id}">Close</button>
        </div>
      </td>
    `;
    ledgerBody.appendChild(tr);
  });
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

// ---------- data loading ----------

async function loadAllAccounts(){
  try{
    const accounts = await apiRequest('', { method: 'GET' });
    renderAccounts(accounts);
  }catch(err){
    showToast(err.message || 'Could not load accounts', true);
    renderAccounts([]);
  }
}

async function loadAccountById(id){
  try{
    const account = await apiRequest('/' + id, { method: 'GET' });
    renderAccounts([account]);
  }catch(err){
    showToast(err.message || 'Account not found', true);
    renderAccounts([]);
  }
}

// ---------- create account ----------

createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = holderNameInput.value.trim();
  const balance = parseFloat(openingBalance.value);

  if (!name){
    showToast('Enter the account holder name', true);
    return;
  }
  if (isNaN(balance) || balance < 0){
    showToast('Enter a valid opening balance', true);
    return;
  }

  try{
    await apiRequest('', {
      method: 'POST',
      body: JSON.stringify({ accountHolderName: name, balance: balance })
    });
    showToast('Account opened for ' + name);
    createForm.reset();
    lookupId.value = '';
    await loadAllAccounts();
  }catch(err){
    showToast(err.message || 'Could not open account', true);
  }
});

// ---------- lookup ----------

lookupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = lookupId.value;
  if (!id) return;
  await loadAccountById(id);
});

clearLookup.addEventListener('click', () => {
  lookupId.value = '';
  loadAllAccounts();
});

refreshBtn.addEventListener('click', () => {
  if (lookupId.value){
    loadAccountById(lookupId.value);
  } else {
    loadAllAccounts();
  }
});

// ---------- row action delegation ----------

ledgerBody.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const action = btn.getAttribute('data-action');

  if (action === 'deposit' || action === 'withdraw'){
    openAmountModal(action, id);
  } else if (action === 'delete'){
    openDeleteModal(id);
  }
});

// ---------- amount modal ----------

function openAmountModal(type, id){
  pendingAction = { type, id };
  amountModalTitle.textContent = type === 'deposit' ? 'Deposit funds' : 'Withdraw funds';
  amountModalSub.textContent = 'Account #' + id;
  modalStampRing.textContent = type === 'deposit' ? '↓' : '↑';
  modalStampRing.classList.toggle('stamp-ring-danger', type === 'withdraw');
  amountInput.value = '';
  amountModalError.classList.add('hidden');
  amountModalBackdrop.classList.remove('hidden');
  setTimeout(() => amountInput.focus(), 50);
}

function closeAmountModal(){
  amountModalBackdrop.classList.add('hidden');
  pendingAction = null;
}

amountCancel.addEventListener('click', closeAmountModal);
amountModalBackdrop.addEventListener('click', (e) => {
  if (e.target === amountModalBackdrop) closeAmountModal();
});

amountConfirm.addEventListener('click', async () => {
  if (!pendingAction) return;
  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount <= 0){
    amountModalError.textContent = 'Enter a valid amount greater than zero.';
    amountModalError.classList.remove('hidden');
    return;
  }

  const { type, id } = pendingAction;
  try{
    await apiRequest('/' + id + '/' + type, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
    showToast((type === 'deposit' ? 'Deposited ' : 'Withdrew ') + formatMoney(amount) + ' on account #' + id);
    closeAmountModal();
    if (lookupId.value){
      loadAccountById(lookupId.value);
    } else {
      loadAllAccounts();
    }
  }catch(err){
    amountModalError.textContent = err.message || 'Transaction failed';
    amountModalError.classList.remove('hidden');
  }
});

// ---------- delete modal ----------

function openDeleteModal(id){
  pendingAction = { type: 'delete', id };
  deleteModalSub.textContent = 'Account #' + id;
  deleteModalBackdrop.classList.remove('hidden');
}

function closeDeleteModal(){
  deleteModalBackdrop.classList.add('hidden');
  pendingAction = null;
}

deleteCancel.addEventListener('click', closeDeleteModal);
deleteModalBackdrop.addEventListener('click', (e) => {
  if (e.target === deleteModalBackdrop) closeDeleteModal();
});

deleteConfirm.addEventListener('click', async () => {
  if (!pendingAction) return;
  const { id } = pendingAction;
  try{
    await apiRequest('/' + id, { method: 'DELETE' });
    showToast('Account #' + id + ' closed');
    closeDeleteModal();
    if (lookupId.value === String(id)) lookupId.value = '';
    await loadAllAccounts();
  }catch(err){
    showToast(err.message || 'Could not close account', true);
    closeDeleteModal();
  }
});

// ---------- init ----------

loadAllAccounts();
