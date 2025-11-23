const { signTransaction, verifyTransaction } = require('../app/transactionManager');
const { deriveAddress } = require('../app/cryptoUtils');
const nacl = require('tweetnacl');
const fs = require('fs');
const path = require('path');

describe('Golden Test Vectors', () => {
  let keyPair, address, goldenVectors;

  beforeAll(() => {
    const seed = new Uint8Array(32);
    for (let i = 0; i < 32; i++) seed[i] = i;
    keyPair = nacl.sign.keyPair.fromSeed(seed);
    address = deriveAddress(keyPair.publicKey);

    const txs = [
      { name: 'Golden Vector 1 - Transferencia Simple', txObject: { to: '0x1234567890123456789012345678901234567890', value: '100', nonce: '0', data_hex: null }},
      { name: 'Golden Vector 2 - Con Campo Data', txObject: { to: '0x9876543210987654321098765432109876543210', value: '0', nonce: '1', data_hex: '0xaabbccdd' }},
      { name: 'Golden Vector 3 - Valor Grande', txObject: { to: '0x5555555555555555555555555555555555555555', value: '999999999999', nonce: '2', data_hex: null }}
    ];

    goldenVectors = txs.map(v => ({ name: v.name, ...signTransaction(v.txObject, keyPair.secretKey, keyPair.publicKey) }));

    const outputPath = path.join(__dirname, 'golden_vectors_generated.json');
    fs.writeFileSync(outputPath, JSON.stringify({ 
      vectors: goldenVectors,
      metadata: { generated: new Date().toISOString(), seed: 'Deterministic [0..31]', address, pubkey: Buffer.from(keyPair.publicKey).toString('base64') }
    }, null, 2));
    console.log(`\n✅ Golden vectors guardados en: ${outputPath}\n`);
  });

  test('debe verificar Golden Vector 1 - Transferencia Simple', () => {
    const result = verifyTransaction(goldenVectors[0], {});
    expect(result.valid).toBe(true);
  });

  test('debe verificar Golden Vector 2 - Con Campo Data', () => {
    const result = verifyTransaction(goldenVectors[1], {});
    expect(result.valid).toBe(true);
  });

  test('debe verificar Golden Vector 3 - Valor Grande', () => {
    const result = verifyTransaction(goldenVectors[2], {});
    expect(result.valid).toBe(true);
  });

  test('todos los golden vectors deben tener la misma dirección de origen', () => {
    goldenVectors.forEach(v => expect(v.tx.from).toBe(address));
  });

  test('todos los golden vectors deben usar Ed25519', () => {
    goldenVectors.forEach(v => expect(v.sig_scheme).toBe('Ed25519'));
  });

  test('cada golden vector debe tener todos los campos requeridos', () => {
    goldenVectors.forEach(v => {
      expect(v).toHaveProperty('tx');
      expect(v).toHaveProperty('sig_scheme');
      expect(v).toHaveProperty('signature_b64');
      expect(v).toHaveProperty('pubkey_b64');
      expect(v.tx).toHaveProperty('from');
      expect(v.tx).toHaveProperty('to');
      expect(v.tx).toHaveProperty('value');
      expect(v.tx).toHaveProperty('nonce');
      expect(v.tx).toHaveProperty('timestamp');
    });
  });

  test('regenerar la firma debe producir verificación exitosa', () => {
    const orig = goldenVectors[0];
    const regen = signTransaction({ to: orig.tx.to, value: orig.tx.value, nonce: orig.tx.nonce, data_hex: orig.tx.data_hex }, keyPair.secretKey, keyPair.publicKey);
    expect(verifyTransaction(regen, {}).valid).toBe(true);
  });
});