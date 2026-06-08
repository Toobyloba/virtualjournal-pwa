// ── crypto.ts ─────────────────────────────────────────────────────────────────
// AES-256-GCM + PBKDF2-SHA256 via Web Crypto API.
// Auth tag (16 bytes) is automatically appended to ciphertext by SubtleCrypto.

export interface EncryptedPayload {
  salt:       string;   // base64, 32 bytes
  iv:         string;   // base64, 12 bytes
  ciphertext: string;   // base64, ciphertext + appended 16-byte auth tag
  version:    number;   // schema version, currently 1
}

const ITERATIONS  = 210_000;   // OWASP 2023 minimum for PBKDF2-SHA256
const MIN_VERSION = 1;         // reject payloads below this version
const ENC = new TextEncoder();
const DEC = new TextDecoder();

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}

function base64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', ENC.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(plaintext: string, password: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, ENC.encode(plaintext)
  );
  return {
    salt:       bufToBase64(salt.buffer),
    iv:         bufToBase64(iv.buffer),
    ciphertext: bufToBase64(ciphertext),
    version:    1,
  };
}

export async function decrypt(payload: EncryptedPayload, password: string): Promise<string> {
  if (payload.version < MIN_VERSION) {
    throw new Error(`Unsupported payload version ${payload.version} (min ${MIN_VERSION})`);
  }
  const salt = new Uint8Array(base64ToBuf(payload.salt));
  const iv   = new Uint8Array(base64ToBuf(payload.iv));
  const key  = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, key, base64ToBuf(payload.ciphertext)
  );
  return DEC.decode(plain);
}

export async function reEncryptPayload(
  payload: EncryptedPayload, oldPwd: string, newPwd: string
): Promise<EncryptedPayload> {
  const plaintext = await decrypt(payload, oldPwd);
  return encrypt(plaintext, newPwd);
}

export async function verifyPassword(
  testPayload: EncryptedPayload, password: string
): Promise<boolean> {
  try {
    await decrypt(testPayload, password);
    return true;
  } catch {
    return false;
  }
}
