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

// Configura los listeners de eventos básicos
function setupListeners() {
  document.getElementById('btn-create-account').addEventListener('click', createAccount);
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
