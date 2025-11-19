const nacl = require('tweetnacl');

const { deriveAddress } = require('./cryptoUtils');

// Convertir transaccion a texto
function canonicalizer(tx) {
    return JSON.stringify(tx); 
}

// Funcion para firmar
function signTransaction(txObject, privateKey, publicKey) {
    // objeto de la transaccion 
    const fullTx = {
        from: deriveAddress(publicKey),
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

    // D. Retornamos el paquete con la firma y la llave pública
    return {
        tx: fullTx,
        sig_scheme: 'Ed25519',
        signature_b64: Buffer.from(signature).toString('base64'),
        pubkey_b64: Buffer.from(publicKey).toString('base64'),
    };
}

module.exports = { signTransaction };