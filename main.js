const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs'); // FIX: Importado correctamente
const multiKeyStore = require('./app/multiKeyStore');
const { deriveAddress } = require('./app/cryptoUtils'); //FIX:Importado
const { signTransaction, verifyTransaction } = require('./app/transactionManager');
const OUTBOX_DIR = path.join(__dirname, 'outbox');
const INBOX_DIR = path.join(__dirname, 'inbox');
const VERIFIED_DIR = path.join(__dirname, 'verified');
const NONCE_TRACKER = path.join(__dirname, 'nonce_tracker.json');

function ensureDirs() {
    [OUTBOX_DIR, INBOX_DIR, VERIFIED_DIR].forEach(d => {
        if (!fs.existsSync(d)) fs.mkdirSync(d);
        if (!fs.existsSync(NONCE_TRACKER)) fs.writeFileSync(NONCE_TRACKER, '{}');
        multiKeyStore.ensureKeystoresDir();
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // FIX: Agregado
        }
    });
    win.loadFile('index.html');
}

app.whenReady().then(() => {
    ensureDirs();
    createWindow();
    // Agrega soporte básico macOS
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
    app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

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

    ipcMain.handle('get-address', async (e, { keystoreId, password }) => {
        try {
            const { pubKey } = await multiKeyStore.loadPrivateKey(keystoreId, password);
            return { success: true, pubKey: Buffer.from(pubKey).toString('base64'), address: deriveAddress(pubKey) };
        } catch (e) { return { success: false, error: e.message }; }
    });

    ipcMain.handle('sign-transaction', async (e, { keystoreId, password, to, value, nonce, data }) => {
        try {
            const { privKey, pubKey } = await multiKeyStore.loadPrivateKey(keystoreId, password);

            // error
            const signedTx = signTransaction({ to, value, nonce, data_hex: data || null }, privKey, pubKey);

            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const p = path.join(OUTBOX_DIR, `tx-${ts}.json`);
            fs.writeFileSync(p, JSON.stringify(signedTx, null, 2));
            return { success: true, message: 'Transacción firmada', filename: path.basename(p), tx: signedTx };
        } catch (e) { return { success: false, error: e.message }; }
    });
});


// NUEVO: Listar archivos
ipcMain.handle('list-inbox', async () => {
    try {
        const f = fs.readdirSync(INBOX_DIR).filter(x => x.endsWith('.json')).map(x => ({ name: x }));
        return { success: true, files: f };
    } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('list-outbox', async () => {
    try {
        const f = fs.readdirSync(OUTBOX_DIR).filter(x => x.endsWith('.json')).map(x => ({ name: x }));
        return { success: true, files: f };
    } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('verify-transaction', async (e, filename) => {
    try {
        const p = path.join(INBOX_DIR, filename);
        if (!fs.existsSync(p)) throw new Error('Archivo no existe');
        
        const signedTx = JSON.parse(fs.readFileSync(p, 'utf8'));
        
        // Carga nonces 
        let nonces = {};
        if (fs.existsSync(NONCE_TRACKER)) {
             try { nonces = JSON.parse(fs.readFileSync(NONCE_TRACKER, 'utf8')); } catch(err) { nonces = {}; }
        }

        const res = verifyTransaction(signedTx, nonces);

        if (res.valid) {
            const s = signedTx.tx.from;
            if (!nonces[s]) nonces[s] = [];
            nonces[s].push(parseInt(signedTx.tx.nonce, 10));
            
            fs.writeFileSync(NONCE_TRACKER, JSON.stringify(nonces, null, 2));
            fs.renameSync(p, path.join(VERIFIED_DIR, path.basename(p)));
            
            return { success: true, message: 'Verificación exitosa', tx: signedTx.tx };
        } else {
            return { success: false, error: `Verificación fallida: ${res.reason}` };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('list-verified', async () => {
    try {
        const f = fs.readdirSync(VERIFIED_DIR).filter(x => x.endsWith('.json')).map(x => ({ name: x, path: path.join(VERIFIED_DIR, x), stats: fs.statSync(path.join(VERIFIED_DIR, x)) }));
        return { success: true, files: f };
    } catch (e) {
        return { success: false, error: e.message };
    }
});
