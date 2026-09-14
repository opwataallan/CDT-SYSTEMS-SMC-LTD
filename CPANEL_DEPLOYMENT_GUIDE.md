# Cyber Dynamic Tech Marketplace — cPanel Deployment & Hosting Guide

This guide provides step-by-step instructions for publishing and hosting this application on any **cPanel** hosting account.

---

## 🚀 Two Hosting Options on cPanel

You can host this application on cPanel using either of two methods:

| Method | Recommended For | How It Works |
| :--- | :--- | :--- |
| **Option A: Static Web Hosting** *(Fastest & Most Popular)* | Shared hosting with standard Apache/LiteSpeed | Upload the contents of the `dist/` folder to `public_html/`. The included `.htaccess` automatically handles client-side routing, compression, and security. |
| **Option B: Node.js Web Hosting** | cPanel accounts with "Setup Node.js App" enabled | Deploy the full application with the Express server for real-time server-side WooCommerce synchronization. |

---

## 📁 Option A: Static Web Hosting (Most Common)

### Step 1: Build the Production Bundle
If you have SSH/Terminal access, run:
```bash
npm run build
```
This generates the `dist/` folder containing:
- `index.html`
- `.htaccess` (pre-configured for Apache rewrite, caching, Gzip compression & security)
- `assets/` (optimized JavaScript, CSS, and fonts)
- `logo.png`, `logo.jpg`

### Step 2: Upload Files to cPanel
1. Log in to your **cPanel** dashboard.
2. Open **File Manager**.
3. Navigate to `public_html` (or your subdomain directory, e.g., `public_html/shop`).
4. Upload all files from inside the `dist/` folder directly into `public_html`.
   *(Tip: In File Manager, ensure **Show Hidden Files (dotfiles)** is enabled in Settings so that `.htaccess` is uploaded).*
5. Visit your domain (e.g., `https://yourdomain.com`). The store will load immediately!

---

## ⚙️ Option B: Full-Stack Node.js Hosting ("Setup Node.js App")

If your cPanel has the **Setup Node.js App** feature:

### Step 1: Create the Node.js Application in cPanel
1. In cPanel, navigate to **Software** → **Setup Node.js App**.
2. Click **Create Application**.
3. Fill in the configuration:
   - **Node.js version**: Select `v20.x` or `v22.x` (or `v18.x`).
   - **Application mode**: `Production`.
   - **Application root**: Path where files will live (e.g., `cyberdynamictech` or `public_html`).
   - **Application URL**: Your domain or subdomain.
   - **Application startup file**: `app.js` (this startup file is already included in your project).
4. Click **Create**.

### Step 2: Upload Project Files
Upload the project files to the application root directory:
- `app.js`
- `package.json`
- `dist/` (contains `server.cjs` and the frontend assets)
- `.env` (create this file in cPanel and add your environment variables)

### Step 3: Configure Environment Variables
In cPanel's Node.js App page, scroll down to **Environment variables** and add:
- `NODE_ENV`: `production`
- `WOOCOMMERCE_URL`: `https://www.cyberdynamictech.com`
- `WOOCOMMERCE_CONSUMER_KEY`: `ck_your_key_here`
- `WOOCOMMERCE_CONSUMER_SECRET`: `cs_your_secret_here`
- `ADMIN_SECRET_KEY`: `your_random_secret_string`
- `SESSION_SECRET`: `your_random_secret_string`

### Step 4: Install Dependencies & Run
1. Click **Run NPM Install** in the cPanel Node.js interface.
2. Click **Start Application** (or **Restart**).

---

## 🛠️ Key Features Included for cPanel

1. **Pre-configured `.htaccess`**:
   - Routes SPA page refreshes and direct links to `index.html` without 404 errors.
   - Enforces HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`).
   - Enables Gzip/Deflate compression for fast mobile loading.
   - Optimizes browser caching (1-year cache on hashed assets, instant updates on `index.html`).
   - Blocks direct HTTP access to hidden files (`.env`, `.git`).

2. **Subdirectory Support**:
   - If hosting inside a subfolder (e.g., `https://yourdomain.com/store/`), set `VITE_BASE_PATH="/store/"` in your environment and re-run `npm run build`.

3. **URL Hash Navigation & Bookmarks**:
   - Supports direct bookmarked URLs (e.g., `https://yourdomain.com/#product/101` or `https://yourdomain.com/#shop`) and browser Back/Forward navigation across all cPanel hosting configurations.

4. **Resilient Data Architecture**:
   - Works seamlessly with or without an active Node backend, automatically utilizing high-performance caching and offline catalogs if the server is restarting.
