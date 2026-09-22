<?php
/**
 * Standalone Fullscreen PWA App Template
 *
 * Renders the clean React 19 storefront without theme headers, footers, or sidebars.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$brand_name = get_option( 'cdt_brand_name', 'Cyber Dynamic Technologies' );
$assets = CDT_Marketplace_Shortcode::get_asset_files();
$currency = function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'UGX';
$currency_symbol = function_exists( 'get_woocommerce_currency_symbol' ) ? html_entity_decode( get_woocommerce_currency_symbol() ) : 'USh';

$cdt_settings = array(
    'apiUrl'         => esc_url_raw( rest_url( 'cdt/v1' ) ),
    'nonce'          => wp_create_nonce( 'wp_rest' ),
    'siteUrl'        => esc_url_raw( site_url() ),
    'pluginUrl'      => esc_url_raw( CDT_MARKETPLACE_URL ),
    'currency'       => $currency,
    'currencySymbol' => $currency_symbol,
    'whatsappNumber' => get_option( 'cdt_whatsapp_number', '+256779743101' ),
    'hotlineNumber'  => get_option( 'cdt_hotline_number', '0394760459' ),
    'brandName'      => $brand_name,
    'apkDownloadUrl' => get_option( 'cdt_android_apk_url', '' ),
    'isWpPlugin'     => true,
    'standalone'     => true,
);
?><!doctype html>
<html <?php language_attributes(); ?> class="dark">
  <head>
    <meta charset="<?php bloginfo( 'charset' ); ?>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
    <meta name="theme-color" content="#007f19" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="application-name" content="<?php echo esc_attr( $brand_name ); ?>" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="<?php echo esc_attr( $brand_name ); ?>" />
    <link rel="manifest" href="<?php echo esc_url( CDT_MARKETPLACE_URL . 'assets/manifest.json' ); ?>" />
    <link rel="icon" type="image/svg+xml" href="<?php echo esc_url( CDT_MARKETPLACE_URL . 'assets/icon.svg' ); ?>" />
    <link rel="apple-touch-icon" href="<?php echo esc_url( CDT_MARKETPLACE_URL . 'assets/apple-touch-icon.png' ); ?>" />

    <title><?php echo esc_html( $brand_name ); ?> Marketplace — Premier Tech & Electronics Uganda</title>
    <meta name="description" content="Premier Ugandan technology and electronics e-commerce marketplace for Cyber Dynamic Technologies, powered by WooCommerce integration with MTN MoMo, Airtel Money, and real-time catalog syncing." />

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">

    <?php if ( ! empty( $assets['css'] ) ) : ?>
      <link rel="stylesheet" href="<?php echo esc_url( CDT_MARKETPLACE_URL . 'assets/' . $assets['css'] ); ?>" />
    <?php endif; ?>

    <script>
      window.cdtSettings = <?php echo wp_json_encode( $cdt_settings ); ?>;
    </script>
  </head>
  <body style="margin:0;padding:0;background:#030712;color:#f3f4f6;font-family:'Plus Jakarta Sans',sans-serif;overflow-x:hidden;">
    <div id="root">
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;">
        <div style="width:48px;height:48px;border:3px solid #10b981;border-top-color:transparent;border-radius:50%;animation:cdt-spin 1s linear infinite;"></div>
        <div style="font-size:16px;font-weight:600;color:#10b981;">Loading Cyber Dynamic Technologies Marketplace...</div>
      </div>
    </div>

    <style>
      @keyframes cdt-spin { to { transform: rotate(360deg); } }
    </style>

    <?php if ( ! empty( $assets['js'] ) ) : ?>
      <script type="module" crossorigin src="<?php echo esc_url( CDT_MARKETPLACE_URL . 'assets/' . $assets['js'] ); ?>"></script>
    <?php endif; ?>
  </body>
</html>
