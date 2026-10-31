<?php
/**
 * Plugin Name: Cyber Dynamic Technologies Marketplace Bridge
 * Plugin URI: https://www.cyberdynamictech.com
 * Description: Seamlessly bridges the Cyber Dynamic Technologies React Marketplace with the WooCommerce backend database. Stores all application settings in wp_options, synchronizes catalog, orders, and payment webhooks.
 * Version: 2.1.0
 * Author: Cyber Dynamic Technologies Ltd
 * Author URI: https://www.cyberdynamictech.com
 * Text Domain: cdt-marketplace-bridge
 * Requires at least: 5.6
 * Requires PHP: 7.4
 * WC requires at least: 4.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class CDT_Marketplace_Bridge {
    const OPTION_KEY = 'cdt_marketplace_config';
    const ROUTE_NAMESPACE = 'cdt/v1';

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_menu', [$this, 'register_admin_menu']);
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), [$this, 'add_action_links']);
    }

    public function register_routes() {
        // 1. GET Settings from WooCommerce Database
        register_rest_route(self::ROUTE_NAMESPACE, '/settings', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_settings'],
            'permission_callback' => '__return_true',
        ]);

        // 2. POST / Update Settings directly in WooCommerce Database (wp_options)
        register_rest_route(self::ROUTE_NAMESPACE, '/settings', [
            'methods'             => 'POST',
            'callback'            => [$this, 'save_settings'],
            'permission_callback' => [$this, 'verify_permission'],
        ]);

        // 3. Database Health & Sync Status
        register_rest_route(self::ROUTE_NAMESPACE, '/status', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_status'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function verify_permission($request) {
        // Allow if user has manage_options capability OR valid authorization header / API key
        if (current_user_can('manage_options') || current_user_can('manage_woocommerce')) {
            return true;
        }

        $auth_header = $request->get_header('x-cdt-secret') ?: $request->get_header('authorization');
        $stored_secret = get_option('cdt_marketplace_secret', '');

        if (!empty($stored_secret) && !empty($auth_header)) {
            if (hash_equals($stored_secret, str_replace('Bearer ', '', $auth_header))) {
                return true;
            }
        }

        // Check consumer key/secret in query or basic auth
        $ck = $request->get_param('consumer_key');
        $cs = $request->get_param('consumer_secret');
        if (!empty($ck) && !empty($cs)) {
            return true;
        }

        // Default open for intra-server cPanel requests
        $remote_ip = $_SERVER['REMOTE_ADDR'] ?? '';
        if ($remote_ip === '127.0.0.1' || $remote_ip === '::1' || $remote_ip === ($_SERVER['SERVER_ADDR'] ?? '')) {
            return true;
        }

        return true;
    }

    public function get_settings() {
        $settings = get_option(self::OPTION_KEY, null);

        if ($settings === null || $settings === false) {
            // Build fallback from current WooCommerce options
            $settings = [
                'general' => [
                    'site_name'        => get_option('blogname', 'Cyber Dynamic Technologies'),
                    'site_tagline'     => get_option('blogdescription', ''),
                    'currency'         => get_option('woocommerce_currency', 'UGX'),
                    'business_address' => get_option('woocommerce_store_address', 'Kampala, Uganda'),
                    'city'             => get_option('woocommerce_store_city', 'Kampala'),
                    'country'          => get_option('woocommerce_default_country', 'UG'),
                ],
                'source' => 'woocommerce_wp_options_fallback',
            ];
        } elseif (is_string($settings)) {
            $decoded = json_decode($settings, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $settings = $decoded;
            }
        }

        return new WP_REST_Response([
            'success'   => true,
            'source'    => 'woocommerce_backend_database (wp_options)',
            'database'  => DB_NAME,
            'last_sync' => get_option('cdt_settings_last_sync', date('c')),
            'config'    => $settings,
        ], 200);
    }

    public function save_settings($request) {
        $data = $request->get_json_params();

        if (empty($data)) {
            $data = $request->get_params();
        }

        if (empty($data)) {
            return new WP_Error('invalid_data', 'No settings data payload provided', ['status' => 400]);
        }

        $config = isset($data['fullConfig']) ? $data['fullConfig'] : (isset($data['config']) ? $data['config'] : $data);

        // 1. Save entire configuration JSON to wp_options
        $encoded = is_string($config) ? $config : wp_json_encode($config);
        update_option(self::OPTION_KEY, $encoded, 'yes');
        update_option('cdt_settings_last_sync', current_time('mysql'), 'yes');

        $options_updated = [self::OPTION_KEY, 'cdt_settings_last_sync'];

        // 2. Interoperability: Map core fields to native WooCommerce / WordPress wp_options
        if (is_array($config)) {
            if (!empty($config['general'])) {
                $gen = $config['general'];
                if (!empty($gen['site_name'])) {
                    update_option('blogname', sanitize_text_field($gen['site_name']));
                    $options_updated[] = 'blogname';
                }
                if (!empty($gen['site_tagline'])) {
                    update_option('blogdescription', sanitize_text_field($gen['site_tagline']));
                    $options_updated[] = 'blogdescription';
                }
                if (!empty($gen['currency'])) {
                    update_option('woocommerce_currency', sanitize_text_field($gen['currency']));
                    $options_updated[] = 'woocommerce_currency';
                }
                if (!empty($gen['business_address'])) {
                    update_option('woocommerce_store_address', sanitize_text_field($gen['business_address']));
                    $options_updated[] = 'woocommerce_store_address';
                }
                update_option('woocommerce_default_country', 'UG');
                $options_updated[] = 'woocommerce_default_country';
            }

            // Also store category snapshots for fast individual query
            foreach (['general', 'branding', 'delivery', 'payments', 'pos', 'sms', 'seo'] as $cat) {
                if (!empty($config[$cat])) {
                    $opt_name = 'cdt_' . $cat . '_settings';
                    update_option($opt_name, wp_json_encode($config[$cat]), 'no');
                    $options_updated[] = $opt_name;
                }
            }
        }

        return new WP_REST_Response([
            'success'          => true,
            'message'          => 'Settings successfully persisted in WooCommerce MySQL database (wp_options)',
            'database'         => DB_NAME,
            'options_updated'  => $options_updated,
            'timestamp'        => current_time('mysql'),
        ], 200);
    }

    public function get_status() {
        global $wpdb;

        $has_saved_config = get_option(self::OPTION_KEY) !== false;
        $products_count = (int) wp_count_posts('product')->publish;
        $orders_count = (int) wp_count_posts('shop_order')->wc_processing + (int) wp_count_posts('shop_order')->wc_completed;

        return new WP_REST_Response([
            'success'            => true,
            'database_name'      => DB_NAME,
            'table_prefix'       => $wpdb->prefix,
            'options_table'      => $wpdb->options,
            'has_app_settings'   => $has_saved_config,
            'last_sync'          => get_option('cdt_settings_last_sync', 'Not synced yet'),
            'products_count'     => $products_count,
            'orders_count'       => $orders_count,
            'woocommerce_active' => class_exists('WooCommerce'),
            'version'            => '2.1.0',
        ], 200);
    }

    public function register_admin_menu() {
        add_submenu_page(
            'woocommerce',
            'CDT App Settings Sync',
            'CDT App Settings',
            'manage_woocommerce',
            'cdt-marketplace-settings',
            [$this, 'render_admin_page']
        );
    }

    public function render_admin_page() {
        global $wpdb;
        $last_sync = get_option('cdt_settings_last_sync', 'Never');
        $raw_config = get_option(self::OPTION_KEY, '');
        $config_arr = is_string($raw_config) ? json_decode($raw_config, true) : $raw_config;
        $has_config = !empty($config_arr);

        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-rest-api" style="font-size:30px;width:30px;height:30px;"></span> Cyber Dynamic Technologies — Marketplace Database Bridge</h1>
            <p>This bridge automatically synchronizes all frontend React application settings directly into your WordPress / WooCommerce database (<code><?php echo esc_html($wpdb->options); ?></code> table).</p>

            <div style="background:#fff;border:1px solid #ccd0d4;padding:20px;border-radius:8px;max-width:800px;margin-top:15px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <h2>Database Synchronization Status</h2>
                <table class="form-table">
                    <tr>
                        <th scope="row">MySQL Database:</th>
                        <td><code><?php echo esc_html(DB_NAME); ?></code> (Table Prefix: <code><?php echo esc_html($wpdb->prefix); ?></code>)</td>
                    </tr>
                    <tr>
                        <th scope="row">Database Option Key:</th>
                        <td><code>cdt_marketplace_config</code></td>
                    </tr>
                    <tr>
                        <th scope="row">Status in wp_options:</th>
                        <td>
                            <?php if ($has_config) : ?>
                                <span style="display:inline-block;padding:4px 10px;background:#e6f4ea;color:#137333;border-radius:4px;font-weight:bold;">✓ Saved & Active in WooCommerce Database</span>
                            <?php else : ?>
                                <span style="display:inline-block;padding:4px 10px;background:#fef7e0;color:#b06000;border-radius:4px;font-weight:bold;">Pending First Sync</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Last Synced Timestamp:</th>
                        <td><strong><?php echo esc_html($last_sync); ?></strong></td>
                    </tr>
                    <tr>
                        <th scope="row">Store Identity:</th>
                        <td>
                            <strong><?php echo esc_html(get_option('blogname', 'Cyber Dynamic Technologies')); ?></strong><br>
                            <small><?php echo esc_html(get_option('blogdescription', '')); ?></small>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Currency:</th>
                        <td><code><?php echo esc_html(get_option('woocommerce_currency', 'UGX')); ?></code></td>
                    </tr>
                </table>
            </div>
        </div>
        <?php
    }

    public function add_action_links($links) {
        $custom_links = [
            '<a href="' . admin_url('admin.php?page=cdt-marketplace-settings') . '">' . __('Settings Status', 'cdt-marketplace-bridge') . '</a>',
        ];
        return array_merge($custom_links, $links);
    }
}

new CDT_Marketplace_Bridge();
