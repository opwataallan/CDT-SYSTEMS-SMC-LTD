/**
 * ==============================================================================
 * Cyber Dynamic Tech Marketplace - cPanel Node.js Application Startup File
 * ==============================================================================
 *
 * This file serves as the primary entry point for cPanel's "Setup Node.js App"
 * management interface (Phusion Passenger).
 *
 * In cPanel:
 * 1. Open "Setup Node.js App"
 * 2. Set Application root to your project folder
 * 3. Set Application startup file to: app.js
 * 4. Run "npm run build" in Terminal or click "Run NPM Install"
 * 5. Start / Restart the Application
 */

process.env.NODE_ENV = 'production';

const fs = require('fs');
const path = require('path');

const serverBundlePath = path.resolve(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(serverBundlePath)) {
  try {
    require(serverBundlePath);
  } catch (err) {
    console.error('[cPanel Startup] Error executing server bundle:', err);
    throw err;
  }
} else {
  console.error(
    `[cPanel Startup] Build artifact not found at ${serverBundlePath}.\n` +
    `Please run "npm run build" inside your project root or via cPanel Terminal before booting the server.`
  );
  process.exit(1);
}
