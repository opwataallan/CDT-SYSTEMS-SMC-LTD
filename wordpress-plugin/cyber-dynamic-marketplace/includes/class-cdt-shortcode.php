<?php
/**
 * Shortcode & Frontend Enqueue Handler
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class CDT_Marketplace_Shortcode {

    /**
     * Register shortcodes
     */
    public static function register_shortcodes() {
        add_shortcode( 'cyber_dynamic_marketplace', array( __CLASS__, 'render_shortcode' ) );
        add_shortcode( 'cdt_marketplace', array( __CLASS__, 'render_shortcode' ) );
    }

    /**
     * Locate built JavaScript and CSS bundles from the plugin assets folder
     */
    public static function get_asset_files() {
        $assets_dir = CDT_MARKETPLACE_PATH . 'assets/';
        $js_file = '';
        $css_file = '';

        if ( is_dir( $assets_dir ) ) {
            $files = scandir( $assets_dir );
            foreach ( $files as $file ) {
                if ( substr( $file, -3 ) === '.js' && strpos( $file, 'index-' ) === 0 ) {
                    $js_file = $file;
                }
                if ( substr( $file, -4 ) === '.css' && strpos( $file, 'index-' ) === 0 ) {
                    $css_file = $file;
                }
            }
        }

        return array(
            'js'  => $js_file,
            'css' => $css_file,
        );
    }

    /**
     * Enqueue React frontend assets
     */
    public static function enqueue_assets() {
        // Enqueue Google Fonts
        wp_enqueue_style(
            'cdt-fonts',
            'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap',
            array(),
            null
        );

        $assets = self::get_asset_files();

        if ( ! empty( $assets['css'] ) ) {
            wp_enqueue_style(
                'cdt-marketplace-style',
                CDT_MARKETPLACE_URL . 'assets/' . $assets['css'],
                array(),
                CDT_MARKETPLACE_VERSION
            );
        }

        if ( ! empty( $assets['js'] ) ) {
            wp_enqueue_script(
                'cdt-marketplace-app',
                CDT_MARKETPLACE_URL . 'assets/' . $assets['js'],
                array(),
                CDT_MARKETPLACE_VERSION,
                true
            );

            // Configure script type="module" for Vite ES module bundle
            add_filter( 'script_loader_tag', function( $tag, $handle ) {
                if ( 'cdt-marketplace-app' === $handle ) {
                    return str_replace( '<script ', '<script type="module" crossorigin ', $tag );
                }
                return $tag;
            }, 10, 2 );

            // Pass WordPress context & REST API bridge settings to React
            $currency = function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'UGX';
            $currency_symbol = function_exists( 'get_woocommerce_currency_symbol' ) ? html_entity_decode( get_woocommerce_currency_symbol() ) : 'USh';

            wp_localize_script( 'cdt-marketplace-app', 'cdtSettings', array(
                'apiUrl'         => esc_url_raw( rest_url( 'cdt/v1' ) ),
                'nonce'          => wp_create_nonce( 'wp_rest' ),
                'siteUrl'        => esc_url_raw( site_url() ),
                'pluginUrl'      => esc_url_raw( CDT_MARKETPLACE_URL ),
                'currency'       => $currency,
                'currencySymbol' => $currency_symbol,
                'whatsappNumber' => get_option( 'cdt_whatsapp_number', '+256779743101' ),
                'hotlineNumber'  => get_option( 'cdt_hotline_number', '0394760459' ),
                'brandName'      => get_option( 'cdt_brand_name', 'Cyber Dynamic Technologies' ),
                'apkDownloadUrl' => get_option( 'cdt_android_apk_url', '' ),
                'isWpPlugin'     => true,
            ) );
        }
    }

    /**
     * Render the shortcode HTML container
     */
    public static function render_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'fullscreen' => 'no',
            'min_height' => '850px',
        ), $atts, 'cyber_dynamic_marketplace' );

        self::enqueue_assets();

        $is_fullscreen = ( $atts['fullscreen'] === 'yes' || $atts['fullscreen'] === 'true' );
        $container_style = $is_fullscreen
            ? 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:999999;overflow-y:auto;background:#030712;'
            : 'width:100%;min-height:' . esc_attr( $atts['min_height'] ) . ';position:relative;background:#030712;border-radius:12px;overflow:hidden;';

        ob_start();
        ?>
        <div id="cdt-marketplace-app-root" style="<?php echo esc_attr( $container_style ); ?>">
            <div id="root">
                <div style="display:flex;align-items:center;justify-content:center;min-height:500px;color:#10b981;font-family:sans-serif;flex-direction:column;gap:12px;">
                    <div style="width:40px;height:40px;border:3px solid #10b981;border-top-color:transparent;border-radius:50%;animation:cdt-spin 1s linear infinite;"></div>
                    <div style="font-size:16px;font-weight:600;">Loading Cyber Dynamic Technologies Marketplace...</div>
                </div>
            </div>
        </div>
        <style>
            @keyframes cdt-spin { to { transform: rotate(360deg); } }
            <?php if ( $is_fullscreen ) : ?>
            html, body { overflow: hidden !important; margin: 0 !important; padding: 0 !important; }
            #wpadminbar { display: none !important; }
            <?php endif; ?>
        </style>
        <?php
        return ob_get_clean();
    }
}
