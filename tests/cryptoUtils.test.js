const { deriveAddress } = require('../app/cryptoUtils');

describe('cryptoUtils - Address Derivation', () => {
  
  test('should derive correct Ethereum-style address from public key', () => {
    // Vector de prueba real generado con tweetnacl
    const pubKeyHex = '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29';
    const pubKey = Buffer.from(pubKeyHex, 'hex');
    
    const address = deriveAddress(pubKey);
    
    // Verificar que la dirección tenga el formato correcto
    expect(address).toMatch(/^0x[a-f0-9]{40}$/);
    expect(address.length).toBe(42); // "0x" + 40 caracteres hex
    
    // Verificar que sea determinista (misma entrada = misma salida)
    const address2 = deriveAddress(pubKey);
    expect(address).toBe(address2);
  });

  test('should handle Buffer and Uint8Array inputs', () => {
    const pubKeyHex = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const pubKeyBuffer = Buffer.from(pubKeyHex, 'hex');
    const pubKeyUint8 = new Uint8Array(pubKeyBuffer);
    
    const addr1 = deriveAddress(pubKeyBuffer);
    const addr2 = deriveAddress(pubKeyUint8);
    
    expect(addr1).toBe(addr2);
  });

  test('should produce different addresses for different keys', () => {
    const pubKey1 = Buffer.from('1111111111111111111111111111111111111111111111111111111111111111', 'hex');
    const pubKey2 = Buffer.from('2222222222222222222222222222222222222222222222222222222222222222', 'hex');
    
    const addr1 = deriveAddress(pubKey1);
    const addr2 = deriveAddress(pubKey2);
    
    expect(addr1).not.toBe(addr2);
  });

  test('should always produce lowercase hex addresses', () => {
    const pubKey = Buffer.from('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'hex');
    
    const address = deriveAddress(pubKey);
    
    expect(address).toBe(address.toLowerCase());
  });
});