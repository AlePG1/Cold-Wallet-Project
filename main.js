const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const multiKeyStore = require('./app/multiKeyStore'); 
// 
const OUTBOX_DIR = path.join(__dirname, 'outbox');
const INBOX_DIR = path.join(__dirname, 'inbox');
const VERIFIED_DIR = path.join(__dirname, 'verified');
const NONCE_TRACKER = path.join(__dirname, 'nonce_tracker.json');

function ensureDirs() {
    [OUTBOX_DIR, INBOX_DIR, VERIFIED_DIR].forEach(d => {
        if (!fs.existsSync(d)) fs.mkdirSync(d);
        if (!fs.existsSync(NONCE_TRACKER)) fs.writeFileSync(NONCE_TRACKER, '{}');
    }); 
} 

function createWindow() {
  const win = new BrowserWindow({ width: 1200, height: 800, 
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js')
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
    ensureDirs();
    createWindow();
    // Agrega soporte básico macOS
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

  // NUEVO: Handlers de Cuentas
  ipcMain.handle('get-accounts', async () => {
    try { return { success: true, accounts: multiKeyStore.getAccounts().accounts }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('create-account', async (e, { name, password }) => {
    try {
      const r = await multiKeyStore.createKeystore(name, password);
      return { success: true, message: 'Cuenta creada', address: r.address, pubKey: r.pubKey };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('delete-account', async (e, id) => {
    try { multiKeyStore.deleteAccount(id); return { success: true, message: 'Cuenta eliminada' }; }
    catch (e) { return { success: false, error: e.message }; }
  });
});  
