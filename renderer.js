let accounts = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadAccounts();
  setupTabs();
  setupListeners();
});

async function loadAccounts() {
  const res = await window.walletAPI.getAccounts();
  if (res.success) {
    accounts = res.accounts;
    updateAccountsUI();
    updateAccountSelects();
    document.getElementById('wallet-status').textContent = `${accounts.length} Cuenta${accounts.length !== 1 ? 's' : ''}`;
  }
}

function updateAccountsUI() {
  const div = document.getElementById('accounts-list');
  if (accounts.length === 0) {
    div.innerHTML = '<p class="empty-state">No hay cuentas creadas</p>';
    return;
  }
  
  div.innerHTML = accounts.map(acc => `
    <div class="account-card">
      <div class="account-header">
        <div>
          <div class="account-name">${acc.name}</div>
          <div class="account-address">${acc.address}</div>
          <small style="color: #999;">Creada: ${new Date(acc.created).toLocaleString()}</small>
        </div>
        <button class="btn btn-danger btn-sm" onclick="deleteAcc('${acc.id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

function updateAccountSelects() {
  const selects = ['address-account', 'sign-account'];
  selects.forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">-- Selecciona una cuenta --</option>' +
      accounts.map(a => `<option value="${a.id}">${a.name} (${a.address.slice(0,10)}...)</option>`).join('');
  });
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    });
  });
}

function setupListeners() {
  document.getElementById('btn-create-account').addEventListener('click', createAccount);
  document.getElementById('btn-refresh-accounts').addEventListener('click', loadAccounts);
  document.getElementById('btn-address').addEventListener('click', getAddress);
  document.getElementById('btn-sign').addEventListener('click', signTx);
  
  // NUEVOS: Listeners para gestión de archivos (Inbox, Outbox, Verified)
  document.getElementById('btn-refresh-inbox').addEventListener('click', loadInbox);
  document.getElementById('btn-refresh-outbox').addEventListener('click', loadOutbox);
  document.getElementById('btn-refresh-inbox-files').addEventListener('click', loadInboxTab);
  document.getElementById('btn-refresh-verified').addEventListener('click', loadVerified);
  
  // Carga inicial de listas de archivos
  loadInbox(); 
  loadOutbox(); 
  loadInboxTab(); 
  loadVerified();
}

async function createAccount() {
  const name = document.getElementById('account-name').value;
  const pass = document.getElementById('account-password').value;
  const conf = document.getElementById('account-password-confirm').value;
  const div = document.getElementById('account-result');
  
  if (!name || !pass || !conf) { show(div, 'Completa todos los campos', 'error'); return; }
  if (pass !== conf) { show(div, 'Las contraseñas no coinciden', 'error'); return; }
  if (pass.length < 12) { show(div, 'Contraseña debe tener mín 12 caracteres', 'error'); return; }
  
  const res = await window.walletAPI.createAccount({ name, password: pass });
  if (res.success) {
    show(div, `<h3>✓ Cuenta Creada</h3><div class="result-item"><strong>Dirección:</strong><code>${res.address}</code></div>`, 'success', true);
    document.getElementById('account-name').value = '';
    document.getElementById('account-password').value = '';
    document.getElementById('account-password-confirm').value = '';
    await loadAccounts();
  } else show(div, res.error, 'error');
}

// NUEVO: Función para eliminar cuenta con confirmación
async function deleteAcc(id) {
  if (!confirm('¿Eliminar esta cuenta? Esta acción no se puede deshacer.')) return;
  const res = await window.walletAPI.deleteAccount(id);
  if (res.success) await loadAccounts();
}

async function getAddress() {
  const keystoreId = document.getElementById('address-account').value;
  const pass = document.getElementById('address-password').value;
  const div = document.getElementById('address-result');
  
  if (!keystoreId || !pass) { show(div, 'Selecciona cuenta e ingresa contraseña', 'error'); return; }
  
  const res = await window.walletAPI.getAddress({ keystoreId, password: pass });
  if (res.success) {
    show(div, `<h3>✓ Dirección</h3><div class="result-item"><strong>Clave Pública:</strong><code>${res.publicKey}</code></div><div class="result-item"><strong>Dirección:</strong><code>${res.address}</code></div>`, 'success', true);
    document.getElementById('address-password').value = '';
  } else show(div, res.error, 'error');
}

async function signTx() {
  const keystoreId = document.getElementById('sign-account').value;
  const pass = document.getElementById('sign-password').value;
  const to = document.getElementById('sign-to').value;
  const value = document.getElementById('sign-value').value;
  const nonce = document.getElementById('sign-nonce').value;
  const data = document.getElementById('sign-data').value;
  const div = document.getElementById('sign-result');
  
  if (!keystoreId || !pass || !to || !value || !nonce) { show(div, 'Completa campos obligatorios', 'error'); return; }
  if (!to.startsWith('0x') || to.length !== 42) { show(div, 'Dirección inválida', 'error'); return; }
  
  const res = await window.walletAPI.signTransaction({ keystoreId, password: pass, to, value, nonce, data });
  if (res.success) {
    show(div, `<h3>✓ Firmada</h3><div class="result-item"><strong>Archivo:</strong><code>${res.filename}</code></div><div class="result-item"><strong>Guardado en:</strong> Outbox</div>`, 'success', true);
    ['sign-password','sign-to','sign-value','sign-nonce','sign-data'].forEach(id => document.getElementById(id).value = '');
    loadOutbox(); // Actualiza la lista de outbox automáticamente
  } else show(div, res.error, 'error');
}

// NUEVO: Carga y renderiza archivos de Inbox (para verificación)
async function loadInbox() {
  const div = document.getElementById('inbox-list');
  const res = await window.walletAPI.listInbox();
  div.innerHTML = (res.success && res.files.length) ? 
    res.files.map(f => `<div class="file-item"><span>📥 ${f}</span><button onclick="verify('${f}')">Verificar</button></div>`).join('') :
    '<p class="empty-state">No hay archivos pendientes</p>';
}

// NUEVO: Lógica de verificación de transacciones
async function verify(name) {
  const div = document.getElementById('verify-result');
  const res = await window.walletAPI.verifyTransaction(name);
  if (res.success) {
    show(div, `<h3>✓ Verificada</h3><div class="result-item"><strong>De:</strong><code>${res.from}</code></div><div class="result-item"><strong>Para:</strong><code>${res.to}</code></div><div class="result-item"><strong>Valor:</strong> ${res.value}</div>`, 'success', true);
    loadInbox(); 
    loadVerified();
  } else show(div, res.error, 'error');
}

// NUEVO: Carga lista de archivos de salida (Outbox)
async function loadOutbox() {
  const div = document.getElementById('outbox-list');
  const res = await window.walletAPI.listOutbox();
  div.innerHTML = (res.success && res.files.length) ? 
    res.files.map(f => `<div class="file-item">📤 ${f}</div>`).join('') :
    '<p class="empty-state">No hay transacciones enviadas</p>';
}

// NUEVO: Carga lista de Inbox para la pestaña de Archivos
async function loadInboxTab() {
  const div = document.getElementById('inbox-list-files');
  const res = await window.walletAPI.listInbox();
  div.innerHTML = (res.success && res.files.length) ? 
    res.files.map(f => `<div class="file-item">📥 ${f}</div>`).join('') :
    '<p class="empty-state">No hay archivos recibidos</p>';
}

// NUEVO: Carga lista de transacciones verificadas
async function loadVerified() {
  const div = document.getElementById('verified-list');
  const res = await window.walletAPI.listVerified();
  div.innerHTML = (res.success && res.files.length) ? 
    res.files.map(f => `<div class="file-item">✅ ${f}</div>`).join('') :
    '<p class="empty-state">No hay transacciones verificadas</p>';
}

function show(el, txt, type, html = false) {
  el.classList.remove('hidden', 'success', 'error');
  el.classList.add(type);
  html ? el.innerHTML = txt : el.textContent = txt;
}
