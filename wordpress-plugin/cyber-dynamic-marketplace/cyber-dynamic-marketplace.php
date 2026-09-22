<?php
/**
 * Plugin Name: Cyber Dynamic Technologies Marketplace
 * Plugin URI: https://www.cyberdynamictech.com
 * Description: Progressive Web App (PWA) storefront for Cyber Dynamic Technologies. Features native WooCommerce catalog integration, MTN Mobile Money & Airtel Money checkout, Android install prompts, and Google Gemini AI assistance.
 * Version: 1.0.0
 * Author: Cyber Dynamic Technologies
 * Author URI: https://www.cyberdynamictech.com
 * Text Domain: cyber-dynamic-marketplace
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 9.3
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

// Define Plugin Constants
define( 'CDT_MARKETPLACE_VERSION', '1.0.0' );
define( 'CDT_MARKETPLACE_FILE', __FILE__ );
define( 'CDT_MARKETPLACE_PATH', plugin_dir_path( __FILE__ ) );
define( 'CDT_MARKETPLACE_URL', plugin_dir_url( __FILE__ ) );
define( 'CDT_MARKETPLACE_BASENAME', plugin_basename( __FILE__ ) );

/**
 * Main Plugin Class
 */
final class CDT_Marketplace_Plugin {

    /**
     * Single instance of the class
     */
    private static $instance = null;

    /**
     * Main Instance.
     */
    public static function instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor.
     */
    public function __construct() {
        $this->includes();
        $this->init_hooks();
    }

    /**
     * Include required files.
     */
    private function includes() {
        require_once CDT_MARKETPLACE_PATH . 'includes/class-cdt-rest-api.php';
        require_once CDT_MARKETPLACE_PATH . 'includes/class-cdt-shortcode.php';
        require_once CDT_MARKETPLACE_PATH . 'includes/class-cdt-admin.php';
    }

    /**
     * Hook into WordPress actions and filters.
     */
    private function init_hooks() {
        add_action( 'init', array( $this, 'register_rewrite_endpoints' ) );
        add_filter( 'template_include', array( $this, 'catch_app_template' ) );
        add_filter( 'plugin_action_links_' . CDT_MARKETPLACE_BASENAME, array( $this, 'add_action_links' ) );
        add_action( 'admin_notices', array( $this, 'check_woocommerce_dependency' ) );

        // Register REST API routes
        add_action( 'rest_api_init', array( 'CDT_Marketplace_REST_API', 'register_routes' ) );

        // Register Shortcodes
        add_action( 'init', array( 'CDT_Marketplace_Shortcode', 'register_shortcodes' ) );

        // Admin interface
        if ( is_admin() ) {
            new CDT_Marketplace_Admin();
        }
    }

    /**
     * Check if WooCommerce is installed and active.
     */
    public function check_woocommerce_dependency() {
        if ( ! class_exists( 'WooCommerce' ) ) {
            ?>
            <div class="notice notice-warning is-dismissible">
                <p><strong><?php esc_html_e( 'Cyber Dynamic Technologies Marketplace', 'cyber-dynamic-marketplace' ); ?>:</strong> <?php esc_html_e( 'WooCommerce is not active. The Marketplace will use local fallback catalog data until WooCommerce is activated.', 'cyber-dynamic-marketplace' ); ?></p>
            </div>
            <?php
        }
    }

    /**
     * Add Settings link to plugin actions list.
     */
    public function add_action_links( $links ) {
        $settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=cyber-dynamic-marketplace' ) ) . '">' . esc_html__( 'Settings', 'cyber-dynamic-marketplace' ) . '</a>';
        $app_page_id = get_option( 'cdt_app_page_id' );
        if ( $app_page_id ) {
            $view_link = '<a href="' . esc_url( get_permalink( $app_page_id ) ) . '" target="_blank">' . esc_html__( 'View App', 'cyber-dynamic-marketplace' ) . '</a>';
            array_unshift( $links, $view_link );
        }
        array_unshift( $links, $settings_link );
        return $links;
    }

    /**
     * Register clean rewrite endpoint for /marketplace-app/
     */
    public function register_rewrite_endpoints() {
        add_rewrite_rule( '^marketplace-app/?$', 'index.php?cdt_marketplace_app=1', 'top' );
        add_rewrite_tag( '%cdt_marketplace_app%', '([^&]+)' );
    }

    /**
     * Intercept standalone fullscreen app template
     */
    public function catch_app_template( $template ) {
        if ( get_query_var( 'cdt_marketplace_app' ) || ( isset( $_GET['cdt_fullscreen'] ) && $_GET['cdt_fullscreen'] === '1' ) ) {
            $custom_template = CDT_MARKETPLACE_PATH . 'templates/marketplace-app.php';
            if ( file_exists( $custom_template ) ) {
                return $custom_template;
            }
        }
        return $template;
    }

    /**
     * Plugin activation tasks.
     */
    public static function activate() {
        // Create default Marketplace App page if not already created
        $page_id = get_option( 'cdt_app_page_id' );
        if ( ! $page_id || ! get_post( $page_id ) ) {
            $new_page_id = wp_insert_post( array(
                'post_title'     => 'Cyber Dynamic Marketplace',
                'post_name'      => 'marketplace',
                'post_content'   => '[cyber_dynamic_marketplace]',
                'post_status'    => 'publish',
                'post_type'      => 'page',
                'comment_status' => 'closed',
            ) );

            if ( ! is_wp_error( $new_page_id ) ) {
                update_option( 'cdt_app_page_id', $new_page_id );
            }
        }

        // Initialize default options
        if ( ! get_option( 'cdt_whatsapp_number' ) ) {
            update_option( 'cdt_whatsapp_number', '+256779743101' );
        }
        if ( ! get_option( 'cdt_hotline_number' ) ) {
            update_option( 'cdt_hotline_number', '0394760459' );
        }
        if ( ! get_option( 'cdt_brand_name' ) ) {
            update_option( 'cdt_brand_name', 'Cyber Dynamic Technologies' );
        }

        // Flush rewrite rules for custom endpoints
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation tasks.
     */
    public static function deactivate() {
        flush_rewrite_rules();
    }
}

// Register activation & deactivation hooks
register_activation_hook( CDT_MARKETPLACE_FILE, array( 'CDT_Marketplace_Plugin', 'activate' ) );
register_deactivation_hook( CDT_MARKETPLACE_FILE, array( 'CDT_Marketplace_Plugin', 'deactivate' ) );

// Initialize plugin
add_action( 'plugins_loaded', array( 'CDT_Marketplace_Plugin', 'instance' ) );
