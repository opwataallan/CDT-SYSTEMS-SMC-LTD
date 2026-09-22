# Cyber Dynamic Technologies Marketplace — Complete cPanel Deployment & Hosting Guide

This production guide walks you step-by-step through deploying and running the **Cyber Dynamic Technologies Marketplace** on any standard **cPanel hosting account** (including shared hosting with or without root/SSH access).

---

## 📋 Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [What Files to Upload](#2-what-files-to-upload)
3. [Where to Upload Them (Directory Structure)](#3-where-to-upload-them-directory-structure)
4. [What Folder Should Be Public](#4-what-folder-should-be-public)
5. [Database Setup (Self-Contained vs MySQL/phpMyAdmin)](#5-database-setup-self-contained-vs-mysqlphpmyadmin)
6. [Configuring Environment Variables](#6-configuring-environment-variables)
7. [Configuring Node.js in cPanel ("Setup Node.js App")](#7-configuring-nodejs-in-cpanel-setup-nodejs-app)
8. [Node.js Version Selection](#8-nodejs-version-selection)
9. [Application Startup File](#9-application-startup-file)
10. [Production Commands (Build, Install, Start)](#10-production-commands-build-install-start)
11. [Configuring the Domain or Subdomain](#11-configuring-the-domain-or-subdomain)
12. [Configuring Free SSL (HTTPS)](#12-configuring-free-ssl-https)
13. [Apache & .htaccess Configuration](#13-apache--htaccess-configuration)
14. [Starting & Restarting the Application](#14-starting--restarting-the-application)
15. [How to Test the WooCommerce API](#15-how-to-test-the-woocommerce-api)
16. [How to Test the Gemini AI Functionality](#16-how-to-test-the-gemini-ai-functionality)
17. [Troubleshooting Common Errors](#17-troubleshooting-common-errors)
18. [WordPress Coexistence & Shared Hosting Limitations](#18-wordpress-coexistence--shared-hosting-limitations)

---

## 1. Overview & Architecture

The application is built with:
- **Frontend**: React 19 Single Page Application (SPA), Tailwind CSS, PWA offline caching.
- **Backend**: Express Node.js server handling secure WooCommerce REST API queries, MTN MoMo / Airtel Money checkout, security tokens, file uploads, and server-side Gemini AI.
- **Hosting Engine**: Apache with mod_rewrite + Phusion Passenger (cPanel "Setup Node.js App").

Two deployment modes are supported on cPanel:
- **Full-Stack Node.js (Recommended)**: Runs both the frontend and the Express backend via cPanel's **Setup Node.js App** (Phusion Passenger).
- **Static Frontend on Apache**: Uploads only `dist/` to `public_html/` or a subdirectory while pointing API calls to your existing WooCommerce endpoint or an external backend.

---

## 2. What Files to Upload

You can upload either the pre-packaged archive **`cpanel-production.zip`** or upload the files individually:

| File / Folder | Purpose |
| :--- | :--- |
| **`app.js`** | Startup script executed by cPanel Phusion Passenger. |
| **`package.json`** | Dependencies and scripts needed for `Run NPM Install` in cPanel. |
| **`dist/`** | Contains the compiled React frontend (`index.html`, `assets/`, `sw.js`, `.htaccess`) and the compiled backend server (`server.cjs`). |
| **`data/`** | Contains persistent store `database.json` and server logs. |
| **`public/`** | Static assets and `public/uploads/` directory with `.htaccess` script execution prevention. |
| **`.htaccess`** | Apache routing, HTTPS redirection, compression, and security rules. |
| **`.env.example`** | Template for your server environment variables (copy to `.env`). |
| **`cpanel_mysql_schema.sql`** | Optional MySQL schema for cPanel phpMyAdmin. |

> **Note**: Do **NOT** upload `node_modules/`, `src/`, `server.ts`, or `.git/`. These are development files that are not needed on production.

---

## 3. Where to Upload Them (Directory Structure)

Recommended location: Deploy on a dedicated subdomain to keep your existing WordPress site completely untouched.

### Recommended Setup (Subdomain)
1. In cPanel, go to **Domains** -> **Create A New Domain**.
2. Domain name: `app.yourdomain.com` (or `shop.yourdomain.com`).
3. Document Root: `/home/username/app.yourdomain.com`.
4. Upload all files into `/home/username/app.yourdomain.com/`.

### Resulting Directory Structure in cPanel File Manager:
```text
/home/username/app.yourdomain.com/
├── app.js                          <-- Application startup file
├── package.json                    <-- Node.js package manifest
├── .htaccess                       <-- Apache SPA rewrite & security rules
├── .env                            <-- Your production credentials (hidden dotfile)
├── cpanel_mysql_schema.sql         <-- Optional MySQL database schema
├── dist/
│   ├── index.html                  <-- Frontend Single Page App
│   ├── assets/                     <-- Minified JS, CSS, and SVGs
│   ├── server.cjs                  <-- Bundled Express backend server
│   ├── server.cjs.map
│   ├── sw.js                       <-- Service Worker (PWA)
│   ├── manifest.webmanifest        <-- Web App Manifest
│   └── .htaccess
├── data/
│   ├── database.json               <-- Seeded persistent store
│   └── server.log                  <-- Live troubleshooting log
└── public/
    ├── logo.png
    ├── logo.jpg
    └── uploads/                    <-- Uploaded media directory
        └── .htaccess               <-- PHP execution blocker
```

---

## 4. What Folder Should Be Public

- In **cPanel "Setup Node.js App"**, set:
  - **Application Root**: `app.yourdomain.com`
  - **Application URL**: `app.yourdomain.com`
- Passenger automatically routes web traffic into `app.js`, which securely serves:
  - Public static assets from `dist/`
  - Uploaded media from `public/uploads/`
  - REST endpoints under `/api/*`
  - Everything else falls back to `dist/index.html` for client-side navigation.

---

## 5. Database Setup (Self-Contained vs MySQL/phpMyAdmin)

### Option 1: Zero-Configuration JSON Database (Default)
The application includes a robust, ACID-safe JSON database (`data/database.json`) with atomic file writes.
- **No MySQL database is required** to get started.
- All products, categories, orders, user accounts, and settings persist automatically to `data/database.json`.
- File permissions for `data/`: Set to `0755` (read, write, execute by owner).

### Option 2: MySQL / MariaDB via cPanel (Optional)
If you prefer storing marketplace data in cPanel's MySQL:
1. In cPanel, click **MySQL Databases**.
2. Create a database: `yourcpanel_cdt_marketplace`.
3. Create a MySQL user: `yourcpanel_cdt_user` with a strong password.
4. Add the user to the database with **ALL PRIVILEGES**.
5. Open **phpMyAdmin**, select the newly created database, click the **Import** tab, and select `cpanel_mysql_schema.sql`. Click **Go**.
6. In your `.env` (or cPanel Node.js App environment variables), set:
   ```ini
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=yourcpanel_cdt_marketplace
   DB_USER=yourcpanel_cdt_user
   DB_PASSWORD=your_mysql_password
   ```

---

## 6. Configuring Environment Variables

In cPanel, you can configure environment variables either:
- Inside the **Setup Node.js App** interface under **Environment variables** (recommended)
- Or by creating a file named `.env` in the application root directory.

### Essential Variables:
```ini
NODE_ENV=production
PORT=3000
APP_URL=https://app.yourdomain.com
VITE_BASE_PATH=/
VITE_API_BASE_URL=

# WooCommerce REST API (WordPress -> WooCommerce -> Settings -> Advanced -> REST API)
WOOCOMMERCE_URL=https://www.cyberdynamictech.com
WOOCOMMERCE_CONSUMER_KEY=ck_your_key_here
WOOCOMMERCE_CONSUMER_SECRET=cs_your_secret_here
WOOCOMMERCE_WEBHOOK_SECRET=your_webhook_secret_here

# Google Gemini AI API Key (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=AIzaSy_your_gemini_key_here

# Session & Administrative Secrets (Use random 32+ character strings)
ADMIN_SECRET_KEY=e839fbc8120d91a92e105e19f9394ab1
SESSION_SECRET=b71829f018e8749a029c719284f19812
ADMIN_INITIAL_PASSWORD=YourAdminPassword2026!
```

---

## 7. Configuring Node.js in cPanel ("Setup Node.js App")

1. Log into your **cPanel Dashboard**.
2. Under the **Software** section, click **Setup Node.js App**.
3. Click the blue **Create Application** button.
4. Fill in the fields:
   - **Node.js version**: Select **`20.x`** (or `22.x` or `18.x`).
   - **Application mode**: **Production**.
   - **Application root**: `app.yourdomain.com` (or folder where you uploaded the files).
   - **Application URL**: `app.yourdomain.com`.
   - **Application startup file**: **`app.js`**.
5. Click **Create** at the top right.
6. Under **Environment variables**, click **Add Variable** for each variable listed in Section 6.
7. Click the **Run NPM Install** button to install the production dependencies.
8. Click **Restart** to boot the application.

---

## 8. Node.js Version Selection

- **Recommended**: **Node.js 20.x LTS** or **Node.js 22.x LTS**.
- **Minimum Supported**: Node.js 18.18+.
- **Compatibility**: The included startup file `app.js` supports both standard CommonJS and modern ECMAScript Modules (`"type": "module"`).

---

## 9. Application Startup File

- Always set **Application startup file** to:
  ```text
  app.js
  ```
- `app.js` automatically ensures the `data/` and `public/uploads/` folders exist, sets `NODE_ENV=production`, resolves cPanel socket/TCP ports, and boots the bundled Express server (`dist/server.cjs`).

---

## 10. Production Commands (Build, Install, Start)

### If building locally on your computer:
```bash
# 1. Install local dependencies
npm install

# 2. Build the production client bundle, server bundle, and cpanel zip
npm run build:all
# Or run individually:
npm run build
npm run package:cpanel
```

### If using cPanel Terminal (SSH access):
```bash
# 1. Activate the cPanel virtual environment (cPanel provides this exact command at the top of your Node.js App page):
source /home/username/nodevenv/app.yourdomain.com/20/bin/activate && cd /home/username/app.yourdomain.com

# 2. Install production dependencies:
npm install --omit=dev

# 3. Test starting the app:
node app.js
```

---

## 11. Configuring the Domain or Subdomain

### Using a Subdomain (Strongly Recommended):
1. In cPanel, click **Domains** -> **Create A New Domain**.
2. Enter: `app.cyberdynamictech.com`.
3. Uncheck "Share document root" and enter `app.cyberdynamictech.com`.
4. Point the Node.js application to this subdomain in **Setup Node.js App**.
5. This prevents any possibility of URL conflicts with your main WordPress site.

### Using a Subdirectory (e.g. `cyberdynamictech.com/shop/`):
If you must run the app in a subdirectory alongside WordPress:
1. In your project `.env`, set `VITE_BASE_PATH=/shop/`.
2. Re-run `npm run build`.
3. In WordPress `.htaccess` (in `public_html/.htaccess`), ensure `/shop` is excluded from WordPress rewrite rules:
   ```apache
   RewriteCond %{REQUEST_URI} !^/shop
   ```

---

## 12. Configuring Free SSL (HTTPS)

1. In cPanel, search for **SSL/TLS Status**.
2. Locate your subdomain (e.g. `app.yourdomain.com`).
3. Click the checkbox next to it and click **Run AutoSSL**.
4. Within 2–5 minutes, cPanel will provision a free Let's Encrypt / Sectigo SSL certificate.
5. The included `.htaccess` file automatically forces HTTPS for all visitors while remaining compatible with Cloudflare and cPanel proxy headers.

---

## 13. Apache & .htaccess Configuration

The provided `.htaccess` file includes:
1. **HTTPS Enforcement**: Safely redirects HTTP to HTTPS without redirect loops.
2. **SPA Routing**: Directs browser refreshes (e.g. `https://app.yourdomain.com/cart` or `/orders`) to `index.html`.
3. **WordPress Exclusions**: Explicitly ignores WordPress core folders (`/wp-admin`, `/wp-content`, `/wp-includes`, `/wp-json`).
4. **Proxy Fallback**: If using Apache reverse proxy instead of Passenger, forwards `/api/*` to `http://127.0.0.1:3000/api/`.
5. **Security Rules**: Completely blocks web visitors from viewing `.env`, `.git`, `database.json`, `.sql`, `package.json`, or `.log` files.
6. **Upload Safety**: Disables script execution (`.php`, `.cgi`) inside `public/uploads/`.
7. **Performance**: Enables Gzip/Deflate compression and browser caching headers (1-year immutable cache on hashed assets).

---

## 14. Starting & Restarting the Application

In cPanel:
1. Go to **Software** -> **Setup Node.js App**.
2. Find your application in the list.
3. Click the **Restart** icon (circular arrows) or click **Stop Application** then **Start Application**.
4. Passenger will gracefully reload the Node process without dropping active HTTP connections.

---

## 15. How to Test the WooCommerce API

Once the app is running on cPanel, test the WooCommerce connection:

1. **In your browser or cPanel Terminal**:
   ```bash
   curl -I https://app.yourdomain.com/api/woocommerce/status
   ```
   Or visit `https://app.yourdomain.com/api/woocommerce/status` in your browser.
   It will return a JSON report indicating whether the live REST API or Store API is connected.

2. **Test Live Products Endpoint**:
   ```bash
   curl -s https://app.yourdomain.com/api/woocommerce/products | head -c 200
   ```
   It should return your live products (e.g., Dell Latitude, HP EliteBook, Epson printers).

3. **In the Admin Dashboard**:
   - Log in at `https://app.yourdomain.com` using `admin@cyberdynamictech.com` and your password.
   - Navigate to **Admin Settings** -> **WooCommerce Sync**.
   - Click **Test Connection**. A green badge will confirm your credentials.
   - Click **Sync Catalog Now** to pull the latest inventory and prices from WordPress into the marketplace.

---

## 16. How to Test the Gemini AI Functionality

The application includes dedicated endpoints for verifying the Google Gemini AI integration:

1. **Check AI Status**:
   Visit `https://app.yourdomain.com/api/ai/status` in your browser.
   - If `GEMINI_API_KEY` is configured: Returns `{"success": true, "configured": true, "status": "active", "model": "gemini-2.5-flash"}`.
   - If missing: Returns helpful guidance prompting you to set `GEMINI_API_KEY`.

2. **Test AI Assistant Query**:
   Run this in Terminal or Postman:
   ```bash
   curl -X POST https://app.yourdomain.com/api/ai/assistant \
     -H "Content-Type: application/json" \
     -d '{"message": "What is your best Dell laptop in stock under 1.5 million UGX?"}'
   ```
   The assistant will respond with real product recommendations matching your live WooCommerce catalog.

---

## 17. Troubleshooting Common Errors

### Error: `503 Service Unavailable` or `Application failed to start`
- **Cause**: Phusion Passenger cannot start `app.js` or `dist/server.cjs` is missing.
- **Fix**: Open cPanel **Setup Node.js App**, check the error log by clicking the **stderr.log** link, or inspect `data/server.log`. Run `npm run build` locally and upload the resulting `dist/` directory.

### Error: `Cannot find module 'express'`
- **Cause**: Dependencies have not been installed in the virtual environment.
- **Fix**: In cPanel **Setup Node.js App**, click the **Run NPM Install** button.

### Error: `WooCommerce API returned HTTP 401 Unauthorized`
- **Cause**: Incorrect Consumer Key or Consumer Secret in `.env`.
- **Fix**: In WordPress WP-Admin, go to **WooCommerce** -> **Settings** -> **Advanced** -> **REST API**. Generate a new key with **Read/Write** permissions. Update `WOOCOMMERCE_CONSUMER_KEY` and `WOOCOMMERCE_CONSUMER_SECRET` in cPanel.

### Error: `Page refreshes return 404 Not Found`
- **Cause**: `.htaccess` is missing or Apache `mod_rewrite` is disabled.
- **Fix**: In cPanel File Manager, ensure **Show Hidden Files (dotfiles)** is enabled in Settings. Verify that `.htaccess` is present in the application root directory.

### Error: `Uploaded images return 403 Forbidden`
- **Cause**: File permissions on `public/uploads/` are too restrictive.
- **Fix**: In cPanel File Manager, right-click `public/uploads/` and set permissions to `0755`.

### Where to find server logs:
- **Application Log**: View `data/server.log` directly in cPanel File Manager.
- **Passenger Log**: In your home directory, check `nodevenv/app.yourdomain.com/.../stderr.log`.

---

## 18. WordPress Coexistence & Shared Hosting Limitations

1. **Subdomain Independence**: Deploying to `app.yourdomain.com` creates complete isolation from your main WordPress site (`cyberdynamictech.com`). No WordPress files (`wp-admin`, `wp-content`, plugins, or themes) are ever modified or overwritten.
2. **Process Sleep (Scale-to-Zero)**: On shared cPanel hosts, Passenger may put inactive Node.js processes into sleep mode after 15–30 minutes of zero traffic. The first request after sleep will take 1–2 seconds to wake the process. The built-in Service Worker (PWA) caches the UI so visitors experience zero downtime.
3. **No Root Access Required**: Every step in this guide operates entirely within the standard cPanel user permissions.
