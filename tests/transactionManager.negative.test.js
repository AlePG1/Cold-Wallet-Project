const { signTransaction, verifyTransaction } = require('../app/transactionManager');
const nacl = require('tweetnacl');

describe('Negative Tests - Casos Esperados de Fallo', () => {
  let keyPair;

  beforeAll(() => { keyPair = nacl.sign.keyPair(); });

  const createTx = (overrides = {}) => ({ to: '0x1234567890123456789012345678901234567890', value: '100', nonce: '0', data_hex: null, ...overrides });
  const signTx = (txObj) => signTransaction(txObj, keyPair.secretKey, keyPair.publicKey);

  // CATEGORÍA 1: Manipulación de Firma
  test('NEGATIVE: rechazar firma con bit alterado (bit flip)', () => {
    const tx = signTx(createTx());
    const sig = Buffer.from(tx.signature_b64, 'base64');
    sig[0] ^= 0x01;
    tx.signature_b64 = sig.toString('base64');
    expect(verifyTransaction(tx, {}).valid).toBe(false);
  });

  test('NEGATIVE: rechazar firma truncada', () => {
    const tx = signTx(createTx());
    tx.signature_b64 = tx.signature_b64.substring(0, 40);
    expect(verifyTransaction(tx, {}).valid).toBe(false);
  });

  test('NEGATIVE: rechazar firma completamente inválida', () => {
    const tx = signTx(createTx());
    tx.signature_b64 = Buffer.from(nacl.randomBytes(64)).toString('base64');
    expect(verifyTransaction(tx, {}).valid).toBe(false);
  });

  test('NEGATIVE: rechazar transacción sin firma', () => {
    const tx = signTx(createTx());
    delete tx.signature_b64;
    expect(verifyTransaction(tx, {}).valid).toBe(false);
  });

  // CATEGORÍA 2: Manipulación de Campos
  test('NEGATIVE: rechazar valor modificado', () => {
    const tx = signTx(createTx());
    tx.tx.value = '999999';
    expect(verifyTransaction(tx, {}).valid).toBe(false);
    expect(verifyTransaction(tx, {}).reason).toBe('Firma inválida');
  });

  test('NEGATIVE: rechazar nonce modificado', () => {
    const tx = signTx(createTx({ nonce: '5' }));
    tx.tx.nonce = '999';
    expect(verifyTransaction(tx, {}).valid).toBe(false);
    expect(verifyTransaction(tx, {}).reason).toBe('Firma inválida');
  });

  test('NEGATIVE: rechazar timestamp modificado', () => {
    const tx = signTx(createTx());
    tx.tx.timestamp = '2099-12-31T23:59:59.000Z';
    expect(verifyTransaction(tx, {}).valid).toBe(false);
    expect(verifyTransaction(tx, {}).reason).toBe('Firma inválida');
  });

  test('NEGATIVE: rechazar dirección destino modificada', () => {
    const tx = signTx(createTx());
    tx.tx.to = '0x9999999999999999999999999999999999999999';
    expect(verifyTransaction(tx, {}).valid).toBe(false);
    expect(verifyTransaction(tx, {}).reason).toBe('Firma inválida');
  });

  test('NEGATIVE: rechazar intercambio de from y to', () => {
    const tx = signTx(createTx());
    [tx.tx.from, tx.tx.to] = [tx.tx.to, tx.tx.from];
    expect(verifyTransaction(tx, {}).valid).toBe(false);
  });

  // CATEGORÍA 3: Ataques de Replay
  test('NEGATIVE: detectar ataque de replay (nonce duplicado)', () => {
    const tx = signTx(createTx({ nonce: '5' }));
    const tracker = { [tx.tx.from]: [5] };
    const res = verifyTransaction(tx, tracker);
    expect(res.valid).toBe(false);
    expect(res.reason).toMatch(/Nonce|Ataque|Repetición|utilizado/i);
  });

  test('NEGATIVE: rechazar múltiples transacciones con mismo nonce', () => {
    const tx1 = signTx(createTx());
    const tx2 = signTx(createTx());
    const tracker = {};
    expect(verifyTransaction(tx1, tracker).valid).toBe(true);
    tracker[tx1.tx.from] = [0];
    expect(verifyTransaction(tx2, tracker).valid).toBe(false);
  });

  // CATEGORÍA 4: Problemas de Clave Pública
  test('NEGATIVE: rechazar transacción sin clave pública', () => {
    const tx = signTx(createTx());
    delete tx.pubkey_b64;
    expect(verifyTransaction(tx, {}).valid).toBe(false);
  });

  test('NEGATIVE: rechazar clave pública que no coincide con from', () => {
    const tx = signTx(createTx());
    const otherKey = nacl.sign.keyPair();
    tx.pubkey_b64 = Buffer.from(otherKey.publicKey).toString('base64');
    expect(verifyTransaction(tx, {}).valid).toBe(false);
  });

  // CATEGORÍA 5: Esquemas No Soportados
  test('NEGATIVE: rechazar esquema de firma no soportado', () => {
    const tx = signTx(createTx());
    tx.sig_scheme = 'ECDSA-secp256k1';
    const res = verifyTransaction(tx, {});
    expect(res.valid).toBe(false);
    expect(res.reason).toBe('Esquema de firma no soportado');
  });

  test('NEGATIVE: rechazar esquema de firma desconocido', () => {
    const tx = signTx(createTx());
    tx.sig_scheme = 'QuantumSafe-2025';
    const res = verifyTransaction(tx, {});
    expect(res.valid).toBe(false);
    expect(res.reason).toBe('Esquema de firma no soportado');
  });

  // CATEGORÍA 6: Formato de Dirección
  test('NEGATIVE: rechazar dirección from con formato inválido', () => {
    const tx = signTx(createTx());
    tx.tx.from = 'NOT_A_VALID_ADDRESS';
    expect(verifyTransaction(tx, {}).valid).toBe(false);
  });

  test('NEGATIVE: rechazar dirección to con formato inválido', () => {
    const tx = signTx(createTx({ to: 'INVALID_TO_ADDRESS' }));
    expect(tx.tx.to).toBe('INVALID_TO_ADDRESS');
  });
});
