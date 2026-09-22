# Cyber Dynamic Technologies Marketplace — WordPress Plugin Guide

This guide explains how to install, configure, and use the **Cyber Dynamic Technologies Marketplace WordPress Plugin** (`cyber-dynamic-marketplace.zip`).

---

## 🌟 Why Use the WordPress Plugin?

The WordPress plugin allows you to run the high-performance **React 19 Progressive Web App (PWA)** storefront **directly inside your existing WordPress & WooCommerce site** (`cyberdynamictech.com`):

- **Zero Node.js Server Needed**: Runs directly on your standard WordPress Apache/PHP hosting.
- **Native WooCommerce Speed**: Directly accesses WooCommerce products, categories, stock, and orders with instant database queries (no external API latency or authentication timeouts).
- **1-Click Installation**: Upload `cyber-dynamic-marketplace.zip` directly via **WP-Admin -> Plugins -> Add New -> Upload Plugin**.
- **Uganda Mobile Money**: Customers can checkout using MTN MoMo, Airtel Money, or Cash on Delivery. Orders appear immediately in **WooCommerce -> Orders**.
- **Android Ready**: Mobile visitors receive an install prompt and direct APK download link.
- **Google Gemini AI Assistant**: Built-in intelligent shopping advisor with answers grounded in your live product catalog.

---

## 📦 What Is in the Package?

The plugin archive `cyber-dynamic-marketplace.zip` (1.55 MB) contains:

```text
cyber-dynamic-marketplace/
├── cyber-dynamic-marketplace.php    # Main plugin entry & hooks
├── readme.txt                       # Plugin documentation & changelog
├── includes/
│   ├── class-cdt-rest-api.php       # Native REST API bridge (/wp-json/cdt/v1/)
│   ├── class-cdt-shortcode.php      # [cyber_dynamic_marketplace] shortcode & asset enqueue
│   └── class-cdt-admin.php          # WP-Admin settings panel
├── templates/
│   └── marketplace-app.php          # Fullscreen standalone PWA template (/marketplace-app/)
└── assets/                          # Compiled React 19 bundle, CSS, icons, manifest
```

---

## 🚀 Step-by-Step Installation

### Step 1: Upload the Plugin in WordPress
1. Log in to your WordPress Admin dashboard (`https://www.cyberdynamictech.com/wp-admin`).
2. Go to **Plugins** → **Add New Plugin**.
3. Click the **Upload Plugin** button at the top.
4. Choose the `cyber-dynamic-marketplace.zip` file and click **Install Now**.
5. Click **Activate Plugin**.

### Step 2: Automatic Setup
Upon activation, the plugin automatically creates a new page:
- **Title**: Cyber Dynamic Marketplace
- **URL**: `https://www.cyberdynamictech.com/marketplace/`
- **Content**: `[cyber_dynamic_marketplace]`

---

## ⚙️ Plugin Settings in WP-Admin

Navigate to **Cyber Dynamic** in your WordPress admin menu:

### 1. Brand & Contact Information
- **Brand Name**: `Cyber Dynamic Technologies`
- **WhatsApp Support Number**: `+256779743101`
- **Store Hotline**: `0394760459`

### 2. Android App Download & Install Settings
- **Android APK Direct Download URL**: Enter the URL where your compiled `.apk` file is hosted (e.g. `https://www.cyberdynamictech.com/cyber-dynamic.apk`).
- When set, visitors on Android devices see a notification with a direct download button.

### 3. Google Gemini AI API Configuration
- **Gemini API Key**: Paste your free key from [Google AI Studio](https://aistudio.google.com/app/apikey).
- Powers the smart shopping advisor with real-time stock and specs answers.

### 4. Flashing Announcements & Flash Sales
- **Top Announcement Bar**: Toggle on/off.
- **Announcement Message**: Customize the headline (e.g. `🔥 FLASH SALE: Genuine HP & Dell Laptops in stock! Free Same-Day Delivery across Kampala & Entebbe.`).

---

## 🖥️ Display Options

You have two ways to display the Marketplace on your website:

### Option A: Embedded Page (with Theme Header & Footer)
Use the shortcode in any standard WordPress page or post:
```text
[cyber_dynamic_marketplace]
```
The app embeds cleanly inside your theme container with responsive heights.

### Option B: Edge-to-Edge Standalone Web App
To give visitors a full-screen mobile app experience without theme headers, footers, or sidebars:
1. Visit `https://www.cyberdynamictech.com/marketplace-app/` (automatically handled by the plugin).
2. Or use the shortcode with fullscreen mode on any page:
   ```text
   [cyber_dynamic_marketplace fullscreen="yes"]
   ```

---

## 🛠️ Rebuilding / Updating the Plugin

Whenever you modify the React frontend code and want to generate an updated plugin zip:

```bash
npm run package:plugin
```

This compiles the latest Vite assets and regenerates `cyber-dynamic-marketplace.zip`.
