// ==============================================================================
// Cyber Dynamic Tech Marketplace - cPanel Node.js Application Startup File
// Compatible with cPanel "Setup Node.js App" (Phusion Passenger & Standalone Node)
// Supports both ECMAScript Module ("type": "module") and CommonJS runtimes.
// ==============================================================================

import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// In cPanel startup, default NODE_ENV to production
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Ensure data and uploads directories exist
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const serverBundle = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(serverBundle)) {
  console.log('[cPanel Startup] Loading Cyber Dynamic Marketplace production server...');
  require(serverBundle);
} else {
  console.error('[cPanel Startup] Error: dist/server.cjs not found.');
  console.error('[cPanel Startup] Please run "npm run build" to build the production assets.');
  process.exit(1);
}
