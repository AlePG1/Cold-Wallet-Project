const nacl = require('tweetnacl');
const stableStringify = require('fast-json-stable-stringify');
const { deriveAddress } = require('./cryptoUtils');

// Convertimos transaccion a texto
function canonicalizer(tx) {
    return stableStringify(tx);
}

// Funcion para firmar
function signTransaction(txObject, privateKey, publicKey) {
    // objeto de la transaccion 
    const fullTx = {
        from: deriveAddress(publicKey), // se calcula desde la llave publica
        to: txObject.to,
        value: txObject.value,
        nonce: txObject.nonce,
        data_hex: txObject.data_hex || null,
        timestamp: new Date().toISOString(),
    };

    // Convierte el texto a Bytes para poder firmarlo
    const txBytes = Buffer.from(canonicalizer(fullTx), 'utf8');

    // Firmamos usando la librería TweetNaCl (Algoritmo Ed25519)
    const signature = nacl.sign.detached(txBytes, privateKey);

    // Retornamos el paquete con la firma y la llave pública
    return {
        tx: fullTx,
        sig_scheme: 'Ed25519',
        signature_b64: Buffer.from(signature).toString('base64'),
        pubkey_b64: Buffer.from(publicKey).toString('base64'),
    };
}

// Funcion para verificar transaccion
function verifyTransaction(signedTx) {
  const { tx, signature_b64, pubkey_b64 } = signedTx;
  
  const txBytes = Buffer.from(canonicalizer(tx), 'utf8');
  const signature = Buffer.from(signature_b64, 'base64');
  const publicKey = Buffer.from(pubkey_b64, 'base64');

  const isValid = nacl.sign.detached.verify(txBytes, signature, publicKey);
  
  if (!isValid) return { valid: false, reason: 'Firma inválida' };

  const expectedFrom = deriveAddress(publicKey);
  if(tx.from !== expectedFrom){
    return{valid: false, reason:"discrepancia de dirección (spoofing)"};
  }
  return{valid: true};
}


module.exports = { signTransaction, verifyTransaction, canonicalizer };
