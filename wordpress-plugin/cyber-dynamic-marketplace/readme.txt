=== Cyber Dynamic Technologies Marketplace ===
Contributors: cyberdynamictech
Tags: woocommerce, ecommerce, pwa, react, uganda, mtn momo, airtel money, android, tech
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
WC requires at least: 5.0
WC tested up to: 9.3
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Progressive Web App (PWA) storefront for Cyber Dynamic Technologies, featuring native WooCommerce catalog integration, MTN Mobile Money & Airtel Money checkout, Android install prompts, and Google Gemini AI assistance.

== Description ==

Transform your WooCommerce store into an ultra-fast, modern Progressive Web App (PWA) and Android-ready storefront tailored for Ugandan e-commerce.

Built specifically for **Cyber Dynamic Technologies** (Kampala, Uganda), this plugin embeds a reactive React 19 app that directly syncs with your live WooCommerce products, categories, stock levels, and order workflows.

= Features =
* **Native WooCommerce Integration**: Direct catalog sync with zero external proxy latency.
* **Ugandan Mobile Money**: Full support for MTN Mobile Money, Airtel Money, and Cash on Delivery.
* **Android PWA & APK Notification**: Native Android install banner and custom APK download link.
* **Fast React 19 UI**: Instant category switching, live search, cart drawer, and order tracking.
* **Google Gemini AI Assistant**: Built-in intelligent shopping advisor grounded in your live product catalog.
* **Flexible Display**: Embed anywhere via `[cyber_dynamic_marketplace]` or use the dedicated `/marketplace-app/` full-screen view.

== Installation ==

1. Upload the `cyber-dynamic-marketplace.zip` file via **Plugins -> Add New -> Upload Plugin** in WordPress.
2. Activate the plugin through the **Plugins** menu.
3. A default page **Cyber Dynamic Marketplace** (`/marketplace/`) is automatically created for you.
4. Navigate to **Cyber Dynamic -> Settings** in WP-Admin to configure your WhatsApp number, Android APK link, and Gemini AI key.

== Shortcodes ==

* `[cyber_dynamic_marketplace]` - Embeds the marketplace inside your standard theme layout.
* `[cyber_dynamic_marketplace fullscreen="yes"]` - Renders in edge-to-edge full-viewport app mode.

== Changelog ==

= 1.0.0 =
* Initial official release for Cyber Dynamic Technologies.
* Native WooCommerce REST API endpoints (`/wp-json/cdt/v1/`).
* MTN Mobile Money & Airtel Money checkout integration.
* Google Gemini 2.5 Flash AI shopping assistant.
* Standalone PWA template at `/marketplace-app/`.
