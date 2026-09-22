import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'data');
const LOG_FILE = path.join(LOG_DIR, 'server.log');
const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function sanitizeMessage(msg: string): string {
  // Strip sensitive credentials from log messages
  return msg
    .replace(/cs_[a-zA-Z0-9_-]+/g, 'cs_***')
    .replace(/ck_[a-zA-Z0-9_-]+/g, 'ck_***')
    .replace(/AIza[a-zA-Z0-9_-]+/g, 'AIza***')
    .replace(/password["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, 'password="***"');
}

export function writeServerLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, details?: any) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    // Rotate log file if too large
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > MAX_LOG_SIZE_BYTES) {
        const backupFile = path.join(LOG_DIR, 'server.old.log');
        if (fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile);
        }
        fs.renameSync(LOG_FILE, backupFile);
      }
    }

    const timestamp = new Date().toISOString();
    let entry = `[${timestamp}] [${level}] ${sanitizeMessage(message)}`;
    if (details) {
      if (details instanceof Error) {
        entry += `\nStack: ${details.stack || details.message}`;
      } else if (typeof details === 'object') {
        try {
          entry += `\nDetails: ${sanitizeMessage(JSON.stringify(details))}`;
        } catch {
          entry += `\nDetails: [Object]`;
        }
      } else {
        entry += ` | ${sanitizeMessage(String(details))}`;
      }
    }
    entry += '\n';

    fs.appendFileSync(LOG_FILE, entry, 'utf8');
  } catch (err) {
    // Non-fatal if logging to file fails (e.g. read-only filesystem)
  }
}

export const logger = {
  info: (msg: string, details?: any) => {
    console.log(`[INFO] ${msg}`);
    writeServerLog('INFO', msg, details);
  },
  warn: (msg: string, details?: any) => {
    console.warn(`[WARN] ${msg}`);
    writeServerLog('WARN', msg, details);
  },
  error: (msg: string, details?: any) => {
    console.error(`[ERROR] ${msg}`);
    writeServerLog('ERROR', msg, details);
  },
};
