const nacl = require('tweetnacl');
const stableStringify = require('fast-json-stable-stringify');
const { deriveAddress } = require('./cryptoUtils');

function canonicalizer(tx) {
  return stableStringify(tx);
}

function signTransaction(txObject, privateKey, publicKey) {
  const fullTx = {
    from: deriveAddress(publicKey),
    to: txObject.to,
    value: txObject.value,
    nonce: txObject.nonce,
    data_hex: txObject.data_hex || null,
    timestamp: new Date().toISOString(),
  };
  const txBytes = Buffer.from(canonicalizer(fullTx), 'utf8');
  const signature = nacl.sign.detached(txBytes, privateKey);
  return {
    tx: fullTx,
    sig_scheme: 'Ed25519',
    signature_b64: Buffer.from(signature).toString('base64'),
    pubkey_b64: Buffer.from(publicKey).toString('base64'),
  };
}

function verifyTransaction(signedTx, nonceTracker) {
  try {
    const { tx, sig_scheme, signature_b64, pubkey_b64 } = signedTx;
    if (sig_scheme !== 'Ed25519') return { valid: false, reason: 'Esquema de firma no soportado' };
    const txBytes = Buffer.from(canonicalizer(tx), 'utf8');
    const signature = Buffer.from(signature_b64, 'base64');
    const publicKey = Buffer.from(pubkey_b64, 'base64');
    if (!nacl.sign.detached.verify(txBytes, signature, publicKey)) return { valid: false, reason: 'Firma inválida' };
    const expectedFrom = deriveAddress(publicKey);
    if (tx.from !== expectedFrom) return { valid: false, reason: 'Discrepancia de dirección (tx.from no coincide con pubkey)' };
    const senderNonces = nonceTracker[tx.from] || [];
    if (senderNonces.includes(parseInt(tx.nonce, 10))) return { valid: false, reason: 'Nonce obsoleto o ya utilizado (Ataque de Repetición)' };
    return { valid: true };
  } catch (err) {
    return { valid: false, reason: `Error interno: ${err.message}` };
  }
}

module.exports = { signTransaction, verifyTransaction, canonicalizer };