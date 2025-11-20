const fs = require('fs');
const path = require('path');
const crypto = require('node:crypto');
const nacl = require('tweetnacl');
const argon2 = require('argon2');
const { deriveAddress } = require('./cryptoUtils');

const KEYSTORES_DIR = path.join(__dirname, '../keystores');
const ACCOUNTS_FILE = path.join(__dirname, '../accounts.json');
const KDF_PARAMS = { timeCost: 3, memoryCost: 65536, parallelism: 4, type: argon2.argon2id, hashLength: 32 };

function ensureKeystoresDir() {
  if (!fs.existsSync(KEYSTORES_DIR)) fs.mkdirSync(KEYSTORES_DIR, { recursive: true });
  if (!fs.existsSync(ACCOUNTS_FILE)) fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify({ accounts: [] }));
}

function getAccounts() {
  ensureKeystoresDir();
  return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
}

async function createKeystore(accountName, password) {
  ensureKeystoresDir();
  const accounts = getAccounts();

  
  const keyPair = nacl.sign.keyPair();
  const salt = crypto.randomBytes(16);
  const nonce = crypto.randomBytes(12);
  const kek = await argon2.hash(password, { ...KDF_PARAMS, salt, raw: true });
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, nonce);
  let ciphertext = Buffer.concat([cipher.update(Buffer.from(keyPair.secretKey)), cipher.final()]);
  
  const keystoreId = crypto.randomBytes(16).toString('hex');
  
  const keystoreData = {
    id: keystoreId,
    kdf: 'Argon2id',
    kdf_params: { salt_b64: salt.toString('base64'), t_cost: 3, m_cost: 65536, p: 4 },
    cipher: 'AES-256-GCM',
    cipher_params: { nonce_b64: nonce.toString('base64') },
    ciphertext_b64: ciphertext.toString('base64'),
    tag_b64: cipher.getAuthTag().toString('base64'),
    pubkey_b64: Buffer.from(keyPair.publicKey).toString('base64'),
    scheme: 'Ed25519',
    created: new Date().toISOString(),
  };
  
  fs.writeFileSync(path.join(KEYSTORES_DIR, `${keystoreId}.json`), JSON.stringify(keystoreData, null, 2));
  
  accounts.accounts.push({
    id: keystoreId,
    name: accountName,
    address: deriveAddress(keyPair.publicKey),
    pubkey_b64: keystoreData.pubkey_b64,
    created: keystoreData.created,
  });
  
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
  
  return { address: accounts.accounts[accounts.accounts.length - 1].address, pubKey: keystoreData.pubkey_b64 };
}

module.exports = { ensureKeystoresDir, getAccounts, createKeystore };