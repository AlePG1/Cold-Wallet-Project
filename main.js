// =====================================================
// IMPORTACIONES DE MÓDULOS
// =====================================================

// Electron: Framework para crear aplicaciones de escritorio con tecnologías web
const { app, BrowserWindow, ipcMain } = require('electron');
// - app: Controla el ciclo de vida de la aplicación
// - BrowserWindow: Crea y gestiona ventanas de la aplicación
// - ipcMain: Comunicación entre proceso principal (backend) y renderer (frontend)

const path = require('path');  // Manejo de rutas de archivos multiplataforma
const fs = require('fs');      // Sistema de archivos (leer/escribir archivos)

// Módulos personalizados del proyecto
const multiKeyStore = require('./app/multiKeyStore');  // Gestión de múltiples cuentas/carteras
const { signTransaction, verifyTransaction } = require('./app/transactionManager');  // Firma y verificación de transacciones
const { deriveAddress } = require('./app/cryptoUtils');  // Derivación de direcciones públicas

// =====================================================
// CONFIGURACIÓN DE DIRECTORIOS
// =====================================================

// Directorios para simular el flujo de transacciones (Air-Gap)
const OUTBOX_DIR = path.join(__dirname, 'outbox');      // TX firmadas (salida de máquina fría)
const INBOX_DIR = path.join(__dirname, 'inbox');        // TX recibidas (entrada a máquina caliente)
const VERIFIED_DIR = path.join(__dirname, 'verified');  // TX verificadas correctamente
const NONCE_TRACKER = path.join(__dirname, 'nonce_tracker.json');  // Anti-replay attack

// =====================================================
// FUNCIÓN: ASEGURAR DIRECTORIOS EXISTEN
// =====================================================
function ensureDirs() {
  // Crear directorios si no existen (evita errores de escritura)
  [OUTBOX_DIR, INBOX_DIR, VERIFIED_DIR].forEach(d => { 
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); 
  });
  
  // Crear archivo de nonces vacío si no existe
  if (!fs.existsSync(NONCE_TRACKER)) fs.writeFileSync(NONCE_TRACKER, '{}');
  
  // Crear directorio de keystores (almacén de claves cifradas)
  multiKeyStore.ensureKeystoresDir();
}

// =====================================================
// INICIALIZACIÓN DE LA APLICACIÓN ELECTRON
// =====================================================
app.whenReady().then(() => {
  // Ejecutar cuando Electron esté listo
  ensureDirs();  // Crear estructura de carpetas
  
  // ===== CREAR VENTANA PRINCIPAL =====
  const w = new BrowserWindow({ 
    width: 1200,   // Ancho de ventana
    height: 800,   // Alto de ventana
    webPreferences: { 
      nodeIntegration: false,     // SEGURIDAD: No permitir Node.js en el frontend
      contextIsolation: true,     // SEGURIDAD: Aislar contexto del renderer
      preload: path.join(__dirname, 'preload.js')  // Script de puente seguro backend-frontend
    }
  });
  
  // Cargar interfaz HTML
  w.loadFile('index.html');
  
  // macOS: Recrear ventana cuando se activa la aplicación
  app.on('activate', () => { 
    if (BrowserWindow.getAllWindows().length === 0) w.loadFile('index.html'); 
  });
});

// =====================================================
// CIERRE DE LA APLICACIÓN
// =====================================================
app.on('window-all-closed', () => { 
  // Cerrar app cuando se cierran todas las ventanas (excepto en macOS)
  if (process.platform !== 'darwin') app.quit(); 
});

// =====================================================
// IPC HANDLER 1: OBTENER LISTA DE CUENTAS
// =====================================================
// Frontend solicita lista de todas las cuentas/carteras creadas
ipcMain.handle('get-accounts', async () => {
  try { 
    // Retornar array de cuentas: [{ id, name, address, created }]
    return { success: true, accounts: multiKeyStore.getAccounts().accounts }; 
  }
  catch (e) { 
    return { success: false, error: e.message }; 
  }
});

// =====================================================
// IPC HANDLER 2: CREAR NUEVA CUENTA/CARTERA
// =====================================================
// Frontend envía: { name: "Mi Cartera", password: "contraseña123" }
ipcMain.handle('create-account', async (e, { name, password }) => {
  try { 
    // 1. Generar par Ed25519
    // 2. Derivar KEK con Argon2id (password -> clave de cifrado)
    // 3. Cifrar clave privada con AES-256-GCM
    // 4. Guardar keystore en keystores/[uuid].json
    const r = await multiKeyStore.createKeystore(name, password);
    
    return { 
      success: true, 
      message: 'Cuenta creada', 
      address: r.address,  // Dirección pública (0x...)
      pubKey: r.pubKey     // Clave pública (Base64)
    };
  } catch (e) { 
    return { success: false, error: e.message }; 
  }
});

// =====================================================
// IPC HANDLER 3: ELIMINAR CUENTA
// =====================================================
// Frontend envía: keystoreId (UUID de la cuenta a eliminar)
ipcMain.handle('delete-account', async (e, id) => {
  try { 
    // Eliminar archivo keystores/[id].json y entry en accounts.json
    multiKeyStore.deleteAccount(id); 
    return { success: true, message: 'Cuenta eliminada' }; 
  }
  catch (e) { 
    return { success: false, error: e.message }; 
  }
});

// =====================================================
// IPC HANDLER 4: OBTENER DIRECCIÓN DE CUENTA
// =====================================================
// Frontend envía: { keystoreId: "uuid...", password: "contraseña" }
ipcMain.handle('get-address', async (e, { keystoreId, password }) => {
  try {
    // 1. Leer keystore cifrado del disco
    // 2. Re-derivar KEK con Argon2id (password)
    // 3. Descifrar clave privada con AES-256-GCM
    // 4. Verificar authTag (integridad)
    const { pubKey } = await multiKeyStore.loadPrivateKey(keystoreId, password);
    
    return { 
      success: true, 
      pubKey: Buffer.from(pubKey).toString('base64'),  // Clave pública
      address: deriveAddress(pubKey)  // Dirección derivada con KECCAK-256
    };
  } catch (e) { 
    // Error común: Contraseña incorrecta (authTag falla)
    return { success: false, error: e.message }; 
  }
});

// =====================================================
// IPC HANDLER 5: FIRMAR TRANSACCIÓN (CRÍTICO)
// =====================================================
// Frontend envía: { keystoreId, password, to, value, nonce, data }
ipcMain.handle('sign-transaction', async (e, { keystoreId, password, to, value, nonce, data }) => {
  try {
    // ===== PASO 1: DESCIFRAR CLAVE PRIVADA =====
    const { privKey, pubKey } = await multiKeyStore.loadPrivateKey(keystoreId, password);
    
    // ===== PASO 2: CONSTRUIR Y FIRMAR TRANSACCIÓN =====
    // Proceso interno de signTransaction:
    // 1. Construir objeto TX: { from, to, value, nonce, data_hex, timestamp }
    // 2. Canonicalizar a JSON determinista (claves ordenadas)
    // 3. Convertir a bytes UTF-8
    // 4. Firmar con Ed25519: signature = sign(bytes, privKey)
    // 5. Ensamblar paquete: { tx, sig_scheme, signature_b64, pubkey_b64 }
    const signedTx = signTransaction(
      { to, value, nonce, data_hex: data || null }, 
      privKey, 
      pubKey
    );
    
    // ===== PASO 3: GUARDAR EN OUTBOX =====
    const ts = new Date().toISOString().replace(/[:.]/g, '-');  // Timestamp único
    const p = path.join(OUTBOX_DIR, `tx-${ts}.json`);
    fs.writeFileSync(p, JSON.stringify(signedTx, null, 2));  // Guardar como JSON
    
    return { 
      success: true, 
      message: 'Transacción firmada', 
      filename: path.basename(p),  // Nombre del archivo generado
      tx: signedTx  // TX completa para preview
    };
  } catch (e) { 
    return { success: false, error: e.message }; 
  }
});

// =====================================================
// IPC HANDLER 6: LISTAR ARCHIVOS EN INBOX
// =====================================================
// Frontend solicita lista de transacciones recibidas pendientes de verificar
ipcMain.handle('list-inbox', async () => {
  try {
    // Leer directorio inbox/ y filtrar solo .json
    const f = fs.readdirSync(INBOX_DIR)
      .filter(x => x.endsWith('.json'))
      .map(x => ({ 
        name: x,  // Nombre del archivo
        path: path.join(INBOX_DIR, x),  // Ruta completa
        stats: fs.statSync(path.join(INBOX_DIR, x))  // Metadata (fecha, tamaño)
      }));
    
    return { success: true, files: f };
  } catch (e) { 
    return { success: false, error: e.message }; 
  }
});

// =====================================================
// IPC HANDLER 7: VERIFICAR TRANSACCIÓN (CRÍTICO)
// =====================================================
// Frontend envía: filename (nombre del archivo en inbox)
ipcMain.handle('verify-transaction', async (e, filename) => {
  try {
    // ===== PASO 1: LEER ARCHIVO =====
    const p = path.join(INBOX_DIR, filename);
    if (!fs.existsSync(p)) throw new Error('Archivo no existe');
    
    const signedTx = JSON.parse(fs.readFileSync(p, 'utf8'));
    const nonces = JSON.parse(fs.readFileSync(NONCE_TRACKER, 'utf8'));
    
    // ===== PASO 2: VERIFICAR (5 PASOS) =====
    // Proceso interno de verifyTransaction:
    // 1. Canonicalizar TX a bytes UTF-8
    // 2. Verificar firma Ed25519: verify(bytes, signature, pubKey)
    // 3. Re-derivar dirección: expectedFrom = KECCAK-256(pubKey)
    // 4. Comparar: tx.from === expectedFrom
    // 5. Verificar nonce no usado (anti-replay)
    const res = verifyTransaction(signedTx, nonces);
    
    // ===== PASO 3: SI ES VÁLIDA =====
    if (res.valid) {
      // Actualizar nonce tracker (marcar como usado)
      const s = signedTx.tx.from;  // Dirección del remitente
      if (!nonces[s]) nonces[s] = [];
      nonces[s].push(parseInt(signedTx.tx.nonce, 10));
      fs.writeFileSync(NONCE_TRACKER, JSON.stringify(nonces, null, 2));
      
      // Mover archivo de inbox/ a verified/
      fs.renameSync(p, path.join(VERIFIED_DIR, path.basename(p)));
      
      return { 
        success: true, 
        message: 'Verificación exitosa', 
        tx: signedTx.tx  // Datos de la TX verificada
      };
    }
    
    // ===== SI FALLA LA VERIFICACIÓN =====
    // Posibles razones:
    // - Firma inválida (datos manipulados)
    // - Dirección no coincide (remitente falso)
    // - Nonce ya usado (ataque de repetición)
    return { success: false, error: `Verificación fallida: ${res.reason}` };
    
  } catch (e) { 
    return { success: false, error: e.message }; 
  }
});

// =====================================================
// IPC HANDLER 8: LISTAR ARCHIVOS EN OUTBOX
// =====================================================
// Frontend solicita lista de transacciones firmadas (salida)
ipcMain.handle('list-outbox', async () => {
  try {
    const f = fs.readdirSync(OUTBOX_DIR)
      .filter(x => x.endsWith('.json'))
      .map(x => ({ 
        name: x, 
        path: path.join(OUTBOX_DIR, x), 
        stats: fs.statSync(path.join(OUTBOX_DIR, x)) 
      }));
    
    return { success: true, files: f };
  } catch (e) { 
    return { success: false, error: e.message }; 
  }
});

// =====================================================
// IPC HANDLER 9: LISTAR ARCHIVOS VERIFICADOS
// =====================================================
// Frontend solicita lista de transacciones ya verificadas (histórico)
ipcMain.handle('list-verified', async () => {
  try {
    const f = fs.readdirSync(VERIFIED_DIR)
      .filter(x => x.endsWith('.json'))
      .map(x => ({ 
        name: x, 
        path: path.join(VERIFIED_DIR, x), 
        stats: fs.statSync(path.join(VERIFIED_DIR, x)) 
      }));
    
    return { success: true, files: f };
  } catch (e) { 
    return { success: false, error: e.message }; 
  }
});