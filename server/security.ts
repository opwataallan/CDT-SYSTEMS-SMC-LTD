import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AuditLogEntry } from '../src/types';

// Use environment variable secret if defined; otherwise generate a secure cryptographic secret at server boot
const HMAC_SECRET =
  process.env.SESSION_SECRET ||
  process.env.ADMIN_SECRET_KEY ||
  crypto.randomBytes(32).toString('hex');

// -------------------------------------------------------------
// 1. Password Hashing & Verification (scrypt with salt)
// -------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// 2. Session Token Generator & Validator (HMAC signed)
// -------------------------------------------------------------
export interface SessionPayload {
  userId: number;
  email: string;
  role: string;
  expiresAt: number;
}

export function createSessionToken(payload: Omit<SessionPayload, 'expiresAt'>, validityHours: number = 24): string {
  const expiresAt = Date.now() + validityHours * 3600 * 1000;
  const data = JSON.stringify({ ...payload, expiresAt });
  const base64Data = Buffer.from(data).toString('base64url');
  const signature = crypto.createHmac('sha256', HMAC_SECRET).update(base64Data).digest('base64url');
  return `${base64Data}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [base64Data, signature] = parts;

  const expectedSignature = crypto.createHmac('sha256', HMAC_SECRET).update(base64Data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(base64Data, 'base64url').toString('utf-8');
    const parsed: SessionPayload = JSON.parse(jsonStr);
    if (Date.now() > parsed.expiresAt) {
      return null; // Expired
    }
    return parsed;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// 3. Field-Level Encryption at Rest (AES-256-GCM)
// -------------------------------------------------------------
const ENCRYPTION_KEY = crypto.createHash('sha256').update(HMAC_SECRET).digest();

export function encryptField(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') return plainText;
  if (plainText.startsWith('enc:v1:')) return plainText; // already encrypted

  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('[Encryption Error]', err);
    return plainText;
  }
}

export function decryptField(cipherText: string): string {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith('enc:v1:')) {
    return cipherText;
  }

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 5) return cipherText; // malformed
    const [, , ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Decryption Error] Failed to decrypt field');
    return '[Protected Field]';
  }
}

// -------------------------------------------------------------
// 4. Input Sanitization (XSS & Injection Protection)
// -------------------------------------------------------------
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeString(val: any): string {
  if (val === undefined || val === null) return '';
  if (typeof val !== 'string') val = String(val);

  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/on\w+\s*=\s*[^ >]+/gi, '')
    .trim();
}

export function sanitizeObject<T = any>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? (sanitizeString(obj) as any) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as any;
  }

  const result: any = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = sanitizeObject(v);
  }
  return result;
}

// -------------------------------------------------------------
// 5. Anti-Bot Protection & Honeypot System
// -------------------------------------------------------------
export interface BotChallenge {
  challenge_token: string;
  question: string;
  expires_at: number;
}

export function createBotChallenge(): BotChallenge {
  const a = Math.floor(Math.random() * 8) + 2; // 2 to 9
  const b = Math.floor(Math.random() * 7) + 1; // 1 to 7
  const answer = String(a + b);
  const expires_at = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  const payload = JSON.stringify({ a, b, answer, expires_at });
  const base64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', HMAC_SECRET).update(base64).digest('base64url');
  const challenge_token = `${base64}.${sig}`;

  return {
    challenge_token,
    question: `Security verification: What is ${a} + ${b}?`,
    expires_at,
  };
}

export function verifyBotChallenge(
  challenge_token: string | undefined,
  answer: string | undefined,
  honeypot: string | undefined
): { success: boolean; error?: string } {
  // If honeypot field is filled by an automated bot scraper, immediately reject
  if (honeypot && String(honeypot).trim().length > 0) {
    return { success: false, error: 'Automated submission rejected.' };
  }

  if (!challenge_token || !answer) {
    // If challenge is omitted in dev preview, permit with audit note
    if (process.env.NODE_ENV !== 'production' && !challenge_token && !answer) {
      return { success: true };
    }
    return { success: false, error: 'Please answer the security verification challenge.' };
  }

  const parts = challenge_token.split('.');
  if (parts.length !== 2) {
    return { success: false, error: 'Invalid security challenge token.' };
  }

  const [base64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(base64).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return { success: false, error: 'Tampered security challenge token.' };
  }

  try {
    const data = JSON.parse(Buffer.from(base64, 'base64url').toString('utf8'));
    if (Date.now() > data.expires_at) {
      return { success: false, error: 'Security challenge expired. Please refresh the challenge.' };
    }
    if (String(answer).trim() !== String(data.answer).trim()) {
      return { success: false, error: 'Incorrect security verification answer. Please try again.' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Security challenge verification failed.' };
  }
}

// -------------------------------------------------------------
// 6. Server-Side Input Validators
// -------------------------------------------------------------
export function validateEmail(email: any): { valid: boolean; value?: string; error?: string } {
  if (typeof email !== 'string') return { valid: false, error: 'Email must be a valid text string.' };
  const clean = email.trim().toLowerCase();
  if (clean.length < 5 || clean.length > 100) {
    return { valid: false, error: 'Email must be between 5 and 100 characters.' };
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, error: 'Invalid email address format.' };
  }
  return { valid: true, value: clean };
}

export function validatePassword(password: any, minLength: number = 8): { valid: boolean; error?: string } {
  if (typeof password !== 'string') return { valid: false, error: 'Password must be provided.' };
  if (password.length < minLength) {
    return { valid: false, error: `Password must be at least ${minLength} characters long.` };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password length cannot exceed 128 characters.' };
  }
  return { valid: true };
}

export function validateName(name: any, field = 'Name'): { valid: boolean; value?: string; error?: string } {
  if (typeof name !== 'string') return { valid: false, error: `${field} must be a text string.` };
  const clean = sanitizeString(name);
  if (clean.length < 1 || clean.length > 60) {
    return { valid: false, error: `${field} must be between 1 and 60 characters.` };
  }
  return { valid: true, value: clean };
}

export function validatePhone(phone: any): { valid: boolean; value?: string; error?: string } {
  if (!phone) return { valid: true, value: '' };
  if (typeof phone !== 'string') return { valid: false, error: 'Phone must be a string.' };
  const clean = phone.trim();
  if (clean.length < 7 || clean.length > 25) {
    return { valid: false, error: 'Phone number must be between 7 and 25 characters.' };
  }
  // Allow standard international and domestic formats
  if (!/^\+?[0-9\s\-()]{7,25}$/.test(clean)) {
    return { valid: false, error: 'Invalid phone number format.' };
  }
  return { valid: true, value: clean };
}

export function validatePositiveInt(val: any, field = 'Value', max = 1000): { valid: boolean; value?: number; error?: string } {
  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0 || num > max) {
    return { valid: false, error: `${field} must be a positive whole number between 1 and ${max}.` };
  }
  return { valid: true, value: num };
}

// -------------------------------------------------------------
// 4. Rate Limiter (Sliding Window Per IP)
// -------------------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetTime: number;
  lockedUntil?: number;
}

const ipBuckets = new Map<string, RateLimitRecord>();

export function resetRateLimits() {
  ipBuckets.clear();
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function createRateLimiter(
  windowMs: number = 60000,
  maxRequests: number = 600,
  lockoutMs: number = 5000
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Always permit health checks and config reads
    if (req.path === '/health' || req.path === '/api/health') {
      return next();
    }

    const ip = getClientIp(req);
    const now = Date.now();

    // Local / container internal IPs get a very generous ceiling
    const isLocalOrContainer =
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      ip === 'localhost' ||
      ip === 'unknown' ||
      ip.startsWith('10.') ||
      ip.startsWith('172.') ||
      ip.startsWith('192.168.');

    const effectiveMaxRequests = isLocalOrContainer ? Math.max(maxRequests * 5, 2000) : maxRequests;

    const record = ipBuckets.get(ip) || { count: 0, resetTime: now + windowMs };

    if (record.lockedUntil && now < record.lockedUntil) {
      const waitSeconds = Math.max(1, Math.ceil((record.lockedUntil - now) / 1000));
      res.setHeader('Retry-After', waitSeconds.toString());
      return res.status(429).json({
        error: 'Too many requests',
        message: `Too many requests. Please wait ${waitSeconds}s before retrying.`,
        retry_after_seconds: waitSeconds,
      });
    }

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      delete record.lockedUntil;
    } else {
      record.count++;
      if (record.count > effectiveMaxRequests) {
        record.lockedUntil = now + lockoutMs;
        ipBuckets.set(ip, record);
        const waitSeconds = Math.max(1, Math.ceil(lockoutMs / 1000));
        res.setHeader('Retry-After', waitSeconds.toString());
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit reached. Temporary cooldown for ${waitSeconds}s.`,
          retry_after_seconds: waitSeconds,
        });
      }
    }

    ipBuckets.set(ip, record);
    next();
  };
}

// -------------------------------------------------------------
// 5. In-Memory Audit Trail
// -------------------------------------------------------------
export const auditLogs: AuditLogEntry[] = [
  {
    id: 'log_init',
    timestamp: new Date().toISOString(),
    user_email: 'system@cyberdynamictech.com',
    action: 'SYSTEM_BOOT',
    category: 'System',
    details: 'Cyber Dynamic Tech Marketplace Engine started with security middleware active',
    status: 'success',
  },
];

export function logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  const newLog: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  auditLogs.unshift(newLog);
  if (auditLogs.length > 500) auditLogs.pop();
}
