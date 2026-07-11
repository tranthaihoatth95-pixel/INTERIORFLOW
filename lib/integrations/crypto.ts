import crypto from 'crypto';

/**
 * lib/integrations/crypto.ts — Mã hoá token OAuth AT-REST (AES-256-GCM).
 *
 * SQLite dev.db là file trên đĩa → KHÔNG lưu access/refresh token thô. Khoá lấy từ
 * `INTEGRATION_ENC_KEY` (32 byte base64 trong .env.local, TÁCH khỏi DB). Định dạng lưu:
 * `iv.tag.ciphertext` (base64url, ngăn bằng dấu chấm). Thiếu khoá → ném lỗi rõ (không
 * âm thầm lưu thô).
 */
const ALGO = 'aes-256-gcm';

function key(): Buffer {
  const raw = process.env.INTEGRATION_ENC_KEY;
  if (!raw) {
    throw new Error(
      'INTEGRATION_ENC_KEY chưa cấu hình — không thể mã hoá token tích hợp. Tạo: openssl rand -base64 32',
    );
  }
  const k = Buffer.from(raw, 'base64');
  if (k.length !== 32) throw new Error('INTEGRATION_ENC_KEY phải là 32 byte (base64 của 32 byte).');
  return k;
}

export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64url'), tag.toString('base64url'), enc.toString('base64url')].join('.');
}

export function decryptToken(stored: string): string {
  const [ivB, tagB, dataB] = stored.split('.');
  if (!ivB || !tagB || !dataB) throw new Error('Token lưu sai định dạng (mong iv.tag.ciphertext).');
  const decipher = crypto.createDecipheriv(ALGO, key(), Buffer.from(ivB, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataB, 'base64url')), decipher.final()]).toString('utf8');
}

export function encKeyConfigured(): boolean {
  const raw = process.env.INTEGRATION_ENC_KEY;
  try {
    return !!raw && Buffer.from(raw, 'base64').length === 32;
  } catch {
    return false;
  }
}
