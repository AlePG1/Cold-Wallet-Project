const { keccak256 } = require('js-sha3');

/**
 * Deriva una dirección estilo Ethereum a partir de una clave pública.
 * Proceso: KECCAK-256(pubkey). Se utilizan los últimos 20 bytes del resultado.
 * @param {Uint8Array} pubKeyBytes - La clave pública. Debe ser un array de 32 bytes.
 * @returns {string} - La dirección derivada en formato "0x...".
 */
function deriveAddress(pubKeyBytes) {
  // Conversión de la entrada a un Buffer para el procesamiento con keccak256.
  const pubKeyBuffer = Buffer.isBuffer(pubKeyBytes)
    ? pubKeyBytes
    : Buffer.from(pubKeyBytes);

  // Cálculo del hash KECCAK-256 (estándar de Ethereum).
  const hash = keccak256(pubKeyBuffer);
  const hashBuffer = Buffer.from(hash, 'hext');

  // La dirección se obtiene tomando los últimos 20 bytes del hash.
  const addressBytes = hashBuffer.slice(-20);

  // Formato de la dirección como cadena hexadecimal con prefijo "0x".
  const address = '0x' + addressBytes.toString('hex')

  return address;
}

module.exports = {
  deriveAddress,
};
