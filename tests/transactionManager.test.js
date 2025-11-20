const { signTransaction, verifyTransaction, canonicalizer } = require('../app/transactionManager');
const { deriveAddress } = require('../app/cryptoUtils');
const nacl = require('tweetnacl');

describe('transactionManager - Sign & Verify', () => {
  
  let keyPair;
  let address;
  
  beforeAll(() => {
    // Generar un par de claves para todas las pruebas
    keyPair = nacl.sign.keyPair();
    address = deriveAddress(keyPair.publicKey);
  });

  test('debería firmar una transacción correctamente', () => {
    const txObject = {
      to: '0x1234567890123456789012345678901234567890',
      value: '100',
      nonce: '0',
      data_hex: null
    };
    
    const signedTx = signTransaction(txObject, keyPair.secretKey, keyPair.publicKey);
    
    expect(signedTx.tx).toHaveProperty('from');
    expect(signedTx.tx).toHaveProperty('to');
    expect(signedTx.tx).toHaveProperty('timestamp');
    expect(signedTx.tx.from).toBe(address);
    expect(signedTx.sig_scheme).toBe('Ed25519');
    expect(signedTx.signature_b64).toBeTruthy();
    expect(signedTx.pubkey_b64).toBeTruthy();
  });

  test('debería verificar una transacción válida', () => {
    const txObject = {
      to: '0x1234567890123456789012345678901234567890',
      value: '100',
      nonce: '0',
      data_hex: null
    };
    
    const signedTx = signTransaction(txObject, keyPair.secretKey, keyPair.publicKey);
    
    // CRÍTICO: Pasar nonceTracker vacío, NO undefined
    const nonceTracker = {};
    
    const result = verifyTransaction(signedTx, nonceTracker);
    
    // Si falla, mostrar el motivo para debugging
    if (!result.valid) {
      console.log('La verificación falló:', result.reason);
    }
    
    expect(result.valid).toBe(true);
  });

  test('debería rechazar transacción con firma inválida', () => {
    const txObject = {
      to: '0x1234567890123456789012345678901234567890',
      value: '100',
      nonce: '0',
      data_hex: null
    };
    
    const signedTx = signTransaction(txObject, keyPair.secretKey, keyPair.publicKey);
    
    // Corromper completamente la firma (no solo truncar)
    const sigBuffer = Buffer.from(signedTx.signature_b64, 'base64');
    
    // Cambiar varios bytes para asegurar que sea inválida
    for (let i = 0; i < Math.min(10, sigBuffer.length); i++) {
      sigBuffer[i] = (sigBuffer[i] + 1) % 256;
    }
    
    signedTx.signature_b64 = sigBuffer.toString('base64');
    
    const result = verifyTransaction(signedTx, {});
    
    expect(result.valid).toBe(false);
    // Puede ser "Firma inválida" o "Error interno" dependiendo del tipo de corrupción
    expect(result.reason).toBeTruthy();
  });

  test('debería rechazar transacción con valor modificado', () => {
    const txObject = {
      to: '0x1234567890123456789012345678901234567890',
      value: '100',
      nonce: '0',
      data_hex: null
    };
    
    const signedTx = signTransaction(txObject, keyPair.secretKey, keyPair.publicKey);
    
    // Modificar el valor después de firmar
    signedTx.tx.value = '1000';
    
    const result = verifyTransaction(signedTx, {});
    
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Firma inválida');
  });

  test('debería rechazar transacción con destinatario modificado', () => {
    const txObject = {
      to: '0x1234567890123456789012345678901234567890',
      value: '100',
      nonce: '0',
      data_hex: null
    };
    
    const signedTx = signTransaction(txObject, keyPair.secretKey, keyPair.publicKey);
    
    // Modificar la dirección destino
    signedTx.tx.to = '0x9999999999999999999999999999999999999999';
    
    const result = verifyTransaction(signedTx, {});
    
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Firma inválida');
  });

  test('debería detectar ataques de replay (nonce obsoleto)', () => {
    const txObject = {
      to: '0x1234567890123456789012345678901234567890',
      value: '100',
      nonce: '0',
      data_hex: null
    };
    
    const signedTx = signTransaction(txObject, keyPair.secretKey, keyPair.publicKey);
    
    // CRÍTICO: nonceTracker debe ser un objeto, no undefined
    const nonceTracker = {
      [signedTx.tx.from]: [0] // Nonce 0 ya usado
    };
    
    const result = verifyTransaction(signedTx, nonceTracker);
    
    expect(result.valid).toBe(false);
    // Verificar que contenga la palabra clave correcta
    expect(result.reason).toMatch(/Nonce|Ataque|Repetición|utilizado/i);
  });

  test('debería rechazar transacción con discrepancia de dirección', () => {
    const txObject = {
      to: '0x1234567890123456789012345678901234567890',
      value: '100',
      nonce: '0',
      data_hex: null
    };
    
    const signedTx = signTransaction(txObject, keyPair.secretKey, keyPair.publicKey);
    
    // Guardar la firma original antes de modificar 'from'
    const originalFrom = signedTx.tx.from;
    
    // Modificar el campo 'from' PERO mantener la misma firma
    // Esto hará que falle la verificación de dirección
    signedTx.tx.from = '0x9999999999999999999999999999999999999999';
    
    const result = verifyTransaction(signedTx, {});
    
    expect(result.valid).toBe(false);
    
    // El error puede ser "Firma inválida" porque al cambiar 'from' 
    // la canonicalización cambia y la firma ya no coincide
    // O puede ser "Discrepancia de dirección" si la verificación de dirección ocurre primero
    expect(['Firma inválida', 'Discrepancia de dirección'].some(msg => 
      result.reason.includes(msg)
    )).toBe(true);
  });

  test('el canonicalizador debería producir salida determinística', () => {
    const tx1 = { to: 'addr1', value: '100', nonce: '0' };
    const tx2 = { nonce: '0', value: '100', to: 'addr1' }; // Orden diferente
    
    const canon1 = canonicalizer(tx1);
    const canon2 = canonicalizer(tx2);
    
    expect(canon1).toBe(canon2);
  });

  test('debería rechazar esquema de firma no soportado', () => {
    const txObject = {
      to: '0x1234567890123456789012345678901234567890',
      value: '100',
      nonce: '0',
      data_hex: null
    };
    
    const signedTx = signTransaction(txObject, keyPair.secretKey, keyPair.publicKey);
    
    // Cambiar el esquema de firma
    signedTx.sig_scheme = 'ECDSA';
    
    const result = verifyTransaction(signedTx, {});
    
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Esquema de firma no soportado');
  });

  test('debería manejar transacciones con campo data', () => {
    const txObject = {
      to: '0x1234567890123456789012345678901234567890',
      value: '0',
      nonce: '1',
      data_hex: '0xaabbccdd'
    };
    
    const signedTx = signTransaction(txObject, keyPair.secretKey, keyPair.publicKey);
    
    // CRÍTICO: Pasar nonceTracker vacío para que no falle por nonce
    const nonceTracker = {};
    
    const result = verifyTransaction(signedTx, nonceTracker);
    
    // Si falla, mostrar el motivo
    if (!result.valid) {
      console.log('La verificación del campo data falló:', result.reason);
    }
    
    expect(result.valid).toBe(true);
    expect(signedTx.tx.data_hex).toBe('0xaabbccdd');
  });

  test('debería permitir transacciones con diferentes nonces', () => {
    const txObject1 = {
      to: '0x1234567890123456789012345678901234567890',
      value: '100',
      nonce: '0',
      data_hex: null
    };
    
    const txObject2 = {
      to: '0x1234567890123456789012345678901234567890',
      value: '50',
      nonce: '1',
      data_hex: null
    };
    
    const signedTx1 = signTransaction(txObject1, keyPair.secretKey, keyPair.publicKey);
    const signedTx2 = signTransaction(txObject2, keyPair.secretKey, keyPair.publicKey);
    
    const nonceTracker = {};
    
    // Verificar primera transacción
    const result1 = verifyTransaction(signedTx1, nonceTracker);
    expect(result1.valid).toBe(true);
    
    // Simular que se registró el nonce 0
    nonceTracker[signedTx1.tx.from] = [0];
    
    // Verificar segunda transacción (nonce 1 es válido)
    const result2 = verifyTransaction(signedTx2, nonceTracker);
    expect(result2.valid).toBe(true);
  });

  test('debería tener longitud de firma consistente', () => {
    const txObject = {
      to: '0x1234567890123456789012345678901234567890',
      value: '100',
      nonce: '0',
      data_hex: null
    };
    
    const signedTx = signTransaction(txObject, keyPair.secretKey, keyPair.publicKey);
    const sigBuffer = Buffer.from(signedTx.signature_b64, 'base64');
    
    // La firma Ed25519 debe ser siempre 64 bytes
    expect(sigBuffer.length).toBe(64);
  });

  test('debería incluir timestamp en la transacción firmada', () => {
    const txObject = {
      to: '0x1234567890123456789012345678901234567890',
      value: '100',
      nonce: '0',
      data_hex: null
    };
    
    const signedTx = signTransaction(txObject, keyPair.secretKey, keyPair.publicKey);
    
    expect(signedTx.tx.timestamp).toBeTruthy();
    expect(signedTx.tx.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('debería manejar campo data_hex nulo', () => {
    const txObject = {
      to: '0x1234567890123456789012345678901234567890',
      value: '100',
      nonce: '1',
      data_hex: null
    };
    
    const signedTx = signTransaction(txObject, keyPair.secretKey, keyPair.publicKey);
    
    expect(signedTx.tx.data_hex).toBeNull();
    
    const result = verifyTransaction(signedTx, {});
    expect(result.valid).toBe(true);
  });
});
