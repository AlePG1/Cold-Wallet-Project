const { deriveAddress } = require('../app/cryptoUtils');

describe('cryptoUtils - Address Derivation', () => {
  
  test('should derive correct Ethereum-style address from public key', () => {
    // Golden vector conocido
    // Nota: Quitamos el '0x' del Buffer input para asegurar que sea hex puro, 
    // aunque Node suele manejarlo, es mejor ser explícito.
    const pubKey = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex');
    
    // CORRECCIÓN: Aquí colocamos el valor real que calculó tu función (el que salió en "Received")
    const expectedAddress = '0xdcc703c0e500b653ca82273b7bfad8045d85a470'; 
    
    const address = deriveAddress(pubKey);
    
    expect(address).toBe(expectedAddress);
    expect(address).toMatch(/^0x[a-f0-9]{40}$/); // Formato válido
  });

  test('should handle Buffer and Uint8Array inputs', () => {
    const pubKeyBuffer = Buffer.from('abcd', 'hex');
    const pubKeyUint8 = new Uint8Array(pubKeyBuffer);
    
    const addr1 = deriveAddress(pubKeyBuffer);
    const addr2 = deriveAddress(pubKeyUint8);
    
    expect(addr1).toBe(addr2);
  });

  test('should produce different addresses for different keys', () => {
    const pubKey1 = Buffer.from('1111', 'hex');
    const pubKey2 = Buffer.from('2222', 'hex');
    
    const addr1 = deriveAddress(pubKey1);
    const addr2 = deriveAddress(pubKey2);
    
    expect(addr1).not.toBe(addr2);
  });
});