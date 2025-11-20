const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
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
    const win = new BrowserWindow({ width: 800, height: 600 }); // Config básica
    win.loadFile('index.html');
}

app.whenReady().then(() => {
    ensureDirs();
    createWindow();
});
