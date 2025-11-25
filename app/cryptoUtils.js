const { keccak256 } = require('js-sha3');

/**
 * Deriva una dirección estilo Ethereum desde una clave pública.
 * Proceso: KECCAK-256(pubkey) [12..] (últimos 20 bytes)
 * @param {Uint8Array} pubKeyBytes - La clave pública de 32 bytes.
 * @returns {string} - La dirección en formato "0x...".
 */
function deriveAddress(pubKeyBytes) {
  // Asegurarse de que la entrada sea un buffer para keccak256
  const pubKeyBuffer = Buffer.isBuffer(pubKeyBytes)
    ? pubKeyBytes
    : Buffer.from(pubKeyBytes);

  // Calcular el hash KECCAK-256. ¡No confundir con SHA3-256!
  const hash = keccak256(pubKeyBuffer);
  const hashBuffer = Buffer.from(hash, 'hex');

  // La dirección son los últimos 20 bytes del hash
  const addressBytes = hashBuffer.slice(-20);

  // Formatear como cadena hexadecimal con prefijo "0x"
  const address = '0x' + addressBytes.toString('hex');

  return address;
}

module.exports = {
  deriveAddress,
};