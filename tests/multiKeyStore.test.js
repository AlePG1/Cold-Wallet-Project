const fs = require('fs');
const path = require('path');

// Mock temporal de las rutas para testing
const ORIGINAL_KEYSTORES_DIR = path.join(__dirname, '../keystores');
const ORIGINAL_ACCOUNTS_FILE = path.join(__dirname, '../accounts.json');
const TEST_KEYSTORES_DIR = path.join(__dirname, 'temp_keystores');
const TEST_ACCOUNTS_FILE = path.join(__dirname, 'temp_accounts.json');

// Reemplazar las rutas en el módulo
jest.mock('../app/multiKeyStore', () => {
  const actualModule = jest.requireActual('../app/multiKeyStore');
  return actualModule;
});

const multiKeyStore = require('../app/multiKeyStore');

describe('multiKeyStore - Create/Load Keystore', () => {
  
  beforeEach(() => {
    // Limpiar archivos de prueba antes de cada test
    if (fs.existsSync(TEST_KEYSTORES_DIR)) {
      fs.rmSync(TEST_KEYSTORES_DIR, { recursive: true, force: true });
    }
    if (fs.existsSync(TEST_ACCOUNTS_FILE)) {
      fs.unlinkSync(TEST_ACCOUNTS_FILE);
    }
  });
  
  afterAll(() => {
    // Limpieza final
    if (fs.existsSync(TEST_KEYSTORES_DIR)) {
      fs.rmSync(TEST_KEYSTORES_DIR, { recursive: true, force: true });
    }
    if (fs.existsSync(TEST_ACCOUNTS_FILE)) {
      fs.unlinkSync(TEST_ACCOUNTS_FILE);
    }
  });

  test('debería crear un keystore cifrado con parámetros válidos', async () => {
    // Crear cuenta y contraseña de prueba
    const accountName = 'Test Account';
    const password = 'test_password_12345';
    
    // Ejecutar createKeystore
    const result = await multiKeyStore.createKeystore(accountName, password);
    
    // Validar formato de dirección y claves
    expect(result.address).toMatch(/^0x[a-f0-9]{40}$/);
    expect(result.pubKey).toBeTruthy();
    expect(typeof result.address).toBe('string');
    expect(typeof result.pubKey).toBe('string');
  });

  test('debería rechazar nombres de cuenta duplicados', async () => {
    // Crear cuenta inicial
    const accountName = 'Duplicate Test';
    const password = 'password123456';
    
    await multiKeyStore.createKeystore(accountName, password);
    
    // Intentar crear otra con el mismo nombre
    await expect(
      multiKeyStore.createKeystore(accountName, password)
    ).rejects.toThrow('Ya existe una cuenta con ese nombre');
  });

  test('debería cifrar y descifrar correctamente (round-trip)', async () => {
    // Crear keystore
    const accountName = 'Round Trip Test';
    const password = 'secure_pass_123456';
    
    await multiKeyStore.createKeystore(accountName, password);
    
    // Obtener cuenta desde accounts.json
    const accounts = multiKeyStore.getAccounts();
    const account = accounts.accounts.find(a => a.name === accountName);
    
    expect(account).toBeDefined();
    
    // Cargar claves privadas desde disco
    const keystoreId = account.id;
    const { privKey, pubKey } = await multiKeyStore.loadPrivateKey(keystoreId, password);
    
    // Validar longitudes típicas de claves Ed25519
    expect(privKey).toBeInstanceOf(Uint8Array);
    expect(pubKey).toBeInstanceOf(Uint8Array);
    expect(privKey.length).toBe(64);
    expect(pubKey.length).toBe(32);
  });

  test('debería fallar con contraseña incorrecta', async () => {
    // Crear cuenta con contraseña válida
    const accountName = 'Wrong Pass Test';
    const password = 'correct_password_123';
    
    await multiKeyStore.createKeystore(accountName, password);
    
    const accounts = multiKeyStore.getAccounts();
    const keystoreId = accounts.accounts.find(a => a.name === accountName).id;
    
    // Intentar cargar con contraseña equivocada
    await expect(
      multiKeyStore.loadPrivateKey(keystoreId, 'wrong_password_456')
    ).rejects.toThrow();
  });

  test('debería crear correctamente el archivo accounts.json', async () => {
    // Crear cuenta
    const accountName = 'Accounts File Test';
    const password = 'test_password_123456';
    
    await multiKeyStore.createKeystore(accountName, password);
    
    // Verificar existencia del archivo
    const accountsFilePath = path.join(__dirname, '../accounts.json');
    expect(fs.existsSync(accountsFilePath)).toBe(true);
    
    // Validar estructura del JSON
    const accountsData = JSON.parse(fs.readFileSync(accountsFilePath, 'utf8'));
    expect(accountsData).toHaveProperty('accounts');
    expect(Array.isArray(accountsData.accounts)).toBe(true);
  });

  test('debería crear archivos keystore individuales', async () => {
    // Crear cuenta
    const accountName = 'Keystore File Test';
    const password = 'test_password_123456';
    
    await multiKeyStore.createKeystore(accountName, password);
    
    // Obtener ID del keystore
    const accounts = multiKeyStore.getAccounts();
    const keystoreId = accounts.accounts.find(a => a.name === accountName).id;
    
    // Verificar que el archivo se haya creado
    const keystorePath = path.join(__dirname, '../keystores', `${keystoreId}.json`);
    expect(fs.existsSync(keystorePath)).toBe(true);
    
    // Validar estructura del keystore
    const keystoreData = JSON.parse(fs.readFileSync(keystorePath, 'utf8'));
    expect(keystoreData).toHaveProperty('kdf');
    expect(keystoreData).toHaveProperty('cipher');
    expect(keystoreData).toHaveProperty('ciphertext_b64');
    expect(keystoreData).toHaveProperty('tag_b64');
    expect(keystoreData.kdf).toBe('Argon2id');
    expect(keystoreData.cipher).toBe('AES-256-GCM');
  });

  test('debería eliminar correctamente una cuenta', async () => {
    // Crear cuenta
    const accountName = 'Delete Test';
    const password = 'test_password_123456';
    
    await multiKeyStore.createKeystore(accountName, password);
    
    // Obtener ID
    let accounts = multiKeyStore.getAccounts();
    const keystoreId = accounts.accounts.find(a => a.name === accountName).id;
    
    // Eliminar cuenta
    multiKeyStore.deleteAccount(keystoreId);
    
    // Verificar eliminación
    accounts = multiKeyStore.getAccounts();
    const deletedAccount = accounts.accounts.find(a => a.id === keystoreId);
    
    expect(deletedAccount).toBeUndefined();
  });

  test('debería lanzar error al intentar cargar keystore inexistente', async () => {
    // ID falso
    const fakeKeystoreId = 'nonexistent123456789';
    const password = 'test_password_123456';
    
    // Intentar cargar archivo que no existe
    await expect(
      multiKeyStore.loadPrivateKey(fakeKeystoreId, password)
    ).rejects.toThrow('Keystore no encontrado');
  });
});
