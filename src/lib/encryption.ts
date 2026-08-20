import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET || 'default_secret_key_needs_32_bytes_!'; // 32 bytes

// Ensure key is exactly 32 bytes
const getKey = () => {
  const buffer = Buffer.from(ENCRYPTION_KEY, 'utf8');
  if (buffer.length < 32) return Buffer.concat([buffer, Buffer.alloc(32 - buffer.length)]);
  if (buffer.length > 32) return buffer.subarray(0, 32);
  return buffer;
};

export function encryptJson(data: any): string {
  if (!data) return '';
  try {
    const text = JSON.stringify(data);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return JSON.stringify({ iv: iv.toString('hex'), authTag, encryptedData: encrypted });
  } catch (e) {
    console.error('Encryption failed', e);
    throw new Error('Encryption failed');
  }
}

export function decryptJson(encryptedText: string): any {
  if (!encryptedText) return null;
  try {
    // If it's not a JSON string, it might be legacy unencrypted JSON
    if (!encryptedText.includes('"encryptedData"')) {
      return JSON.parse(encryptedText);
    }
    const parsed = JSON.parse(encryptedText);
    if (!parsed.iv || !parsed.authTag || !parsed.encryptedData) {
      return parsed;
    }
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(parsed.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(parsed.authTag, 'hex'));
    let decrypted = decipher.update(parsed.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (e) {
    console.error('Decryption failed', e);
    return null;
  }
}
