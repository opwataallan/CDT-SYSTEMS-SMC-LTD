// ==============================================================================
// Cyber Dynamic Tech Marketplace - cPanel Node.js Application Startup File
// Compatible with cPanel "Setup Node.js App" (Phusion Passenger)
// ==============================================================================

const path = require('path');
const fs = require('fs');

const serverBundle = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(serverBundle)) {
  require(serverBundle);
} else {
  console.error('[cPanel Startup] Error: dist/server.cjs not found. Please run "npm run build" first.');
  process.exit(1);
}
