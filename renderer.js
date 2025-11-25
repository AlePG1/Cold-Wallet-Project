let accounts = [];

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
  await loadAccounts();
  setupTabs();
  setupListeners();
});

// Carga las cuentas desde el backend
async function loadAccounts() {
  const res = await window.walletAPI.getAccounts();
  if (res.success) {
    accounts = res.accounts;
    updateAccountsUI();
    // Actualiza el badge de estado en el header
    document.getElementById('wallet-status').textContent = `${accounts.length} Cuenta${accounts.length !== 1 ? 's' : ''}`;
  }
}

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
    updateAccountSelects(); // Actualiza los dropdowns
    document.getElementById('wallet-status').textContent = `${accounts.length} Cuenta${accounts.length > 1 ? 's' : ''}`;
  }
}

// Renderiza la lista de cuentas en la UI
function updateAccountsUI() {
  const div = document.getElementById('accounts-list');
  if (accounts.length === 0) {
    div.innerHTML = '<p class="empty-state">No hay cuentas creadas</p>';
    return;
  }
  // Genera el HTML para cada tarjeta de cuenta
  div.innerHTML = accounts.map(acc => `
    <div class="account-card">
      <div class="account-header">
        <div>
          <div class="account-name">${acc.name}</div>
          <div class="account-address">${acc.address}</div>
          <small style="color: #999;">Creada: ${new Date(acc.created).toLocaleString()}</small>
        </div>
        <button class="btn btn-danger btn-sm" onclick="deleteAcc('${acc.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

// Configura la navegación por pestañas
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Remueve clase activa de todos los tabs y paneles
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      // Activa el tab actual y su panel correspondiente
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    });
  });
}

function updateAccountSelects() {
    const selects = ['address-account', 'sign-account'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        sel.innerHTML = '<option value="">-- Selecciona una cuenta --</option>' +
            accounts.map(a => `<option value="${a.id}">${a.name} (${a.address.slice(0, 10)}...)</option>`).join('');
    });
}

// Configura los listeners de eventos básicos
function setupListeners() {
  document.getElementById('btn-create-account').addEventListener('click', createAccount);
  document.getElementById('btn-refresh-accounts').addEventListener('click', loadAccounts);
  document.getElementById('btn-address').addEventListener('click', getAddress); // Listener para obtener dirección
  document.getElementById('btn-sign').addEventListener('click', signTx); // Listener para firmar
}

// Maneja la creación de una nueva cuenta
async function createAccount() {
  const name = document.getElementById('account-name').value;
  const pass = document.getElementById('account-password').value;
  const conf = document.getElementById('account-password-confirm').value;
  const div = document.getElementById('account-result');
  
  // Validaciones básicas
  if (!name || !pass || !conf) { show(div, 'Completa todos los campos', 'error'); return; }
  if (pass !== conf) { show(div, 'Las contraseñas no coinciden', 'error'); return; }
  
  // Llama a la API para crear la cuenta
  const res = await window.walletAPI.createAccount({ name, password: pass });
  if (res.success) {
    show(div, `<h3>✓ Cuenta Creada</h3><div class="result-item"><strong>Dirección:</strong><code>${res.address}</code></div>`, 'success', true);
    // Limpieza de campos
    document.getElementById('account-name').value = '';
    document.getElementById('account-password').value = '';
    document.getElementById('account-password-confirm').value = '';
    await loadAccounts();
  } else show(div, res.error, 'error');
}

// Utilidad para mostrar mensajes de éxito/error
function show(el, txt, type, html = false) {
  el.classList.remove('hidden', 'success', 'error');
  el.classList.add(type);
  html ? el.innerHTML = txt : el.textContent = txt;
}

// NUEVO: Obtiene y muestra la dirección completa y clave pública
async function getAddress() {
    const keystoreId = document.getElementById('address-account').value;
    const pass = document.getElementById('address-password').value;
    const div = document.getElementById('address-result');

    if (!keystoreId || !pass) {
        show(div, 'Selecciona cuenta e ingresa contraseña', 'error');
        return;
    }

    const res = await window.walletAPI.getAddress({
        keystoreId,
        password: pass
    });

    if (res.success) {
        show(div, `<h3>✓ Dirección</h3><div class="result-item"><strong>Clave Pública:</strong> ${res.publicKey}</div>`, 'success', true);
        document.getElementById('address-password').value = '';
    } else {
        show(div, res.error, 'error');
    }
}

// NUEVO: Lógica para firmar una transacción
async function signTx() {
    const keystoreId = document.getElementById('sign-account').value;
    const pass = document.getElementById('sign-password').value;
    const to = document.getElementById('sign-to').value;
    const value = document.getElementById('sign-value').value;
    const nonce = document.getElementById('sign-nonce').value;
    const data = document.getElementById('sign-data').value;
    const div = document.getElementById('sign-result');

    if (!keystoreId || !pass || !to || !value || !nonce) {
        show(div, 'Completa campos obligatorios', 'error');
        return;
    }
    if (!to.startsWith('0x') || to.length !== 42) {
        show(div, 'Dirección inválida', 'error');
        return;
    }

    const res = await window.walletAPI.signTransaction({
        keystoreId,
        password: pass,
        to,
        value,
        nonce,
        data
    });

    if (res.success) {
        show(div, `<h3>✓ Firmada</h3><div class="result-item"><strong>Archivo:</strong> <code>${res.signedTx || 'Generado'}</code></div>`, 'success', true);
        // Limpieza de campos de firma
        ['sign-password', 'sign-to', 'sign-value', 'sign-nonce', 'sign-data'].forEach(id => document.getElementById(id).value = '');
    } else {
        show(div, res.error, 'error');
    }
}

function show(el, txt, type, html = false) {
    el.classList.remove('hidden', 'success', 'error');
    el.classList.add(type);
    html ? el.innerHTML = txt : el.textContent = txt;
}
