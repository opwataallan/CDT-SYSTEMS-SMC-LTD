<?php
/**
 * WP-Admin Settings Page & Dashboard Integration
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class CDT_Marketplace_Admin {

    public function __construct() {
        add_action( 'admin_menu', array( $this, 'register_admin_menu' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
    }

    /**
     * Register Admin Menu Pages
     */
    public function register_admin_menu() {
        add_menu_page(
            __( 'Cyber Dynamic', 'cyber-dynamic-marketplace' ),
            __( 'Cyber Dynamic', 'cyber-dynamic-marketplace' ),
            'manage_options',
            'cyber-dynamic-marketplace',
            array( $this, 'render_settings_page' ),
            'dashicons-laptop',
            56
        );

        add_submenu_page(
            'cyber-dynamic-marketplace',
            __( 'Marketplace Settings', 'cyber-dynamic-marketplace' ),
            __( 'Settings', 'cyber-dynamic-marketplace' ),
            'manage_options',
            'cyber-dynamic-marketplace',
            array( $this, 'render_settings_page' )
        );

        add_submenu_page(
            'cyber-dynamic-marketplace',
            __( 'System Health & Status', 'cyber-dynamic-marketplace' ),
            __( 'Status & Diagnostics', 'cyber-dynamic-marketplace' ),
            'manage_options',
            'cdt-marketplace-status',
            array( $this, 'render_status_page' )
        );
    }

    /**
     * Register WordPress settings
     */
    public function register_settings() {
        register_setting( 'cdt_marketplace_options', 'cdt_brand_name' );
        register_setting( 'cdt_marketplace_options', 'cdt_whatsapp_number' );
        register_setting( 'cdt_marketplace_options', 'cdt_hotline_number' );
        register_setting( 'cdt_marketplace_options', 'cdt_android_apk_url' );
        register_setting( 'cdt_marketplace_options', 'cdt_gemini_api_key' );
        register_setting( 'cdt_marketplace_options', 'cdt_flashing_ads_enabled' );
        register_setting( 'cdt_marketplace_options', 'cdt_announcement_text' );
        register_setting( 'cdt_marketplace_options', 'cdt_app_page_id' );
    }

    /**
     * Render Settings Page
     */
    public function render_settings_page() {
        $app_page_id = get_option( 'cdt_app_page_id' );
        $app_url = $app_page_id ? get_permalink( $app_page_id ) : site_url( '/marketplace/' );
        $standalone_url = site_url( '/marketplace-app/' );
        ?>
        <div class="wrap" style="max-width: 900px;">
            <div style="display:flex;align-items:center;gap:15px;margin-bottom:20px;padding:15px 20px;background:#030712;color:#ffffff;border-radius:10px;">
                <span class="dashicons dashicons-laptop" style="font-size:36px;width:36px;height:36px;color:#10b981;"></span>
                <div>
                    <h1 style="color:#ffffff;margin:0;font-size:22px;">Cyber Dynamic Technologies Marketplace</h1>
                    <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">Progressive Web App (PWA) Storefront & WooCommerce Native Plugin</p>
                </div>
            </div>

            <?php if ( isset( $_GET['settings-updated'] ) ) : ?>
                <div class="notice notice-success is-dismissible">
                    <p><strong><?php esc_html_e( 'Marketplace settings saved successfully.', 'cyber-dynamic-marketplace' ); ?></strong></p>
                </div>
            <?php endif; ?>

            <!-- Quick Access Card -->
            <div class="card" style="padding:15px 20px;margin-bottom:20px;border-left:4px solid #10b981;">
                <h3 style="margin-top:0;"><?php esc_html_e( '🚀 Live Marketplace App Links', 'cyber-dynamic-marketplace' ); ?></h3>
                <p><?php esc_html_e( 'Your mobile-optimized React storefront is active and ready on your website:', 'cyber-dynamic-marketplace' ); ?></p>
                <p>
                    <a href="<?php echo esc_url( $app_url ); ?>" target="_blank" class="button button-primary">
                        <?php esc_html_e( 'Open Embedded Page (with Theme)', 'cyber-dynamic-marketplace' ); ?>
                    </a>
                    &nbsp;
                    <a href="<?php echo esc_url( $standalone_url ); ?>" target="_blank" class="button button-secondary">
                        <?php esc_html_e( 'Open Fullscreen App (Android/PWA View)', 'cyber-dynamic-marketplace' ); ?>
                    </a>
                </p>
                <p style="font-size:13px;color:#6b7280;margin-bottom:0;">
                    <strong>Shortcode:</strong> Use <code>[cyber_dynamic_marketplace]</code> or <code>[cyber_dynamic_marketplace fullscreen="yes"]</code> in any WordPress page or block.
                </p>
            </div>

            <!-- Settings Form -->
            <form method="post" action="options.php">
                <?php settings_fields( 'cdt_marketplace_options' ); ?>

                <div class="card" style="padding:20px;margin-bottom:20px;">
                    <h3><?php esc_html_e( '1. Brand & Contact Information', 'cyber-dynamic-marketplace' ); ?></h3>
                    <table class="form-table">
                        <tr>
                            <th scope="row"><label for="cdt_brand_name"><?php esc_html_e( 'Brand Name', 'cyber-dynamic-marketplace' ); ?></label></th>
                            <td>
                                <input name="cdt_brand_name" type="text" id="cdt_brand_name" value="<?php echo esc_attr( get_option( 'cdt_brand_name', 'Cyber Dynamic Technologies' ) ); ?>" class="regular-text" />
                                <p class="description"><?php esc_html_e( 'Display name shown across the app header and PWA banner.', 'cyber-dynamic-marketplace' ); ?></p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="cdt_whatsapp_number"><?php esc_html_e( 'WhatsApp Support Number', 'cyber-dynamic-marketplace' ); ?></label></th>
                            <td>
                                <input name="cdt_whatsapp_number" type="text" id="cdt_whatsapp_number" value="<?php echo esc_attr( get_option( 'cdt_whatsapp_number', '+256779743101' ) ); ?>" class="regular-text" />
                                <p class="description"><?php esc_html_e( 'International format with country code (e.g. +256779743101).', 'cyber-dynamic-marketplace' ); ?></p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="cdt_hotline_number"><?php esc_html_e( 'Store Hotline / Phone', 'cyber-dynamic-marketplace' ); ?></label></th>
                            <td>
                                <input name="cdt_hotline_number" type="text" id="cdt_hotline_number" value="<?php echo esc_attr( get_option( 'cdt_hotline_number', '0394760459' ) ); ?>" class="regular-text" />
                                <p class="description"><?php esc_html_e( 'Official store phone number for customer inquiries.', 'cyber-dynamic-marketplace' ); ?></p>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="card" style="padding:20px;margin-bottom:20px;">
                    <h3><?php esc_html_e( '2. Android App Download & Install Settings', 'cyber-dynamic-marketplace' ); ?></h3>
                    <table class="form-table">
                        <tr>
                            <th scope="row"><label for="cdt_android_apk_url"><?php esc_html_e( 'Android APK Direct Download URL', 'cyber-dynamic-marketplace' ); ?></label></th>
                            <td>
                                <input name="cdt_android_apk_url" type="url" id="cdt_android_apk_url" value="<?php echo esc_attr( get_option( 'cdt_android_apk_url', '' ) ); ?>" class="large-text" placeholder="https://www.cyberdynamictech.com/cyber-dynamic.apk" />
                                <p class="description"><?php esc_html_e( 'Direct download link for your compiled Android APK file. When configured, mobile visitors will see an install notification with this download link.', 'cyber-dynamic-marketplace' ); ?></p>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="card" style="padding:20px;margin-bottom:20px;">
                    <h3><?php esc_html_e( '3. Google Gemini AI API Configuration', 'cyber-dynamic-marketplace' ); ?></h3>
                    <table class="form-table">
                        <tr>
                            <th scope="row"><label for="cdt_gemini_api_key"><?php esc_html_e( 'Gemini API Key', 'cyber-dynamic-marketplace' ); ?></label></th>
                            <td>
                                <input name="cdt_gemini_api_key" type="password" id="cdt_gemini_api_key" value="<?php echo esc_attr( get_option( 'cdt_gemini_api_key', '' ) ); ?>" class="large-text" placeholder="AIzaSy..." />
                                <p class="description"><?php esc_html_e( 'Obtain a free API key from Google AI Studio (https://aistudio.google.com/app/apikey). Powers the intelligent tech shopping advisor.', 'cyber-dynamic-marketplace' ); ?></p>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="card" style="padding:20px;margin-bottom:20px;">
                    <h3><?php esc_html_e( '4. Flashing Announcements & Flash Sales Bar', 'cyber-dynamic-marketplace' ); ?></h3>
                    <table class="form-table">
                        <tr>
                            <th scope="row"><?php esc_html_e( 'Top Announcement Bar', 'cyber-dynamic-marketplace' ); ?></th>
                            <td>
                                <label>
                                    <input name="cdt_flashing_ads_enabled" type="checkbox" value="yes" <?php checked( get_option( 'cdt_flashing_ads_enabled', 'yes' ), 'yes' ); ?> />
                                    <?php esc_html_e( 'Enable flashing top announcement bar across the app', 'cyber-dynamic-marketplace' ); ?>
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="cdt_announcement_text"><?php esc_html_e( 'Announcement Message', 'cyber-dynamic-marketplace' ); ?></label></th>
                            <td>
                                <textarea name="cdt_announcement_text" id="cdt_announcement_text" rows="3" class="large-text"><?php echo esc_textarea( get_option( 'cdt_announcement_text', '🔥 FLASH SALE: Genuine HP & Dell Laptops in stock! Free Same-Day Delivery across Kampala & Entebbe.' ) ); ?></textarea>
                            </td>
                        </tr>
                    </table>
                </div>

                <?php submit_button( __( 'Save Marketplace Settings', 'cyber-dynamic-marketplace' ) ); ?>
            </form>
        </div>
        <?php
    }

    /**
     * Render Diagnostics & Status Page
     */
    public function render_status_page() {
        $wc_active = class_exists( 'WooCommerce' );
        $product_count = $wc_active ? wp_count_posts( 'product' )->publish : 0;
        $category_count = wp_count_terms( 'product_cat' );
        $has_gemini = (bool) get_option( 'cdt_gemini_api_key' );
        ?>
        <div class="wrap" style="max-width: 900px;">
            <h1><?php esc_html_e( 'Marketplace System Diagnostics', 'cyber-dynamic-marketplace' ); ?></h1>

            <div class="card" style="padding:20px;margin-top:20px;">
                <h3><?php esc_html_e( 'Integration Health Check', 'cyber-dynamic-marketplace' ); ?></h3>
                <table class="widefat striped" style="margin-top:10px;">
                    <tbody>
                        <tr>
                            <td><strong><?php esc_html_e( 'Plugin Version', 'cyber-dynamic-marketplace' ); ?></strong></td>
                            <td><span class="badge" style="background:#10b981;color:#fff;padding:3px 8px;border-radius:4px;"><?php echo esc_html( CDT_MARKETPLACE_VERSION ); ?></span></td>
                        </tr>
                        <tr>
                            <td><strong><?php esc_html_e( 'WooCommerce Status', 'cyber-dynamic-marketplace' ); ?></strong></td>
                            <td>
                                <?php if ( $wc_active ) : ?>
                                    <span style="color:#059669;font-weight:600;">✓ <?php esc_html_e( 'Active & Connected', 'cyber-dynamic-marketplace' ); ?> (v<?php echo esc_html( WC()->version ); ?>)</span>
                                <?php else : ?>
                                    <span style="color:#dc2626;font-weight:600;">✕ <?php esc_html_e( 'WooCommerce Inactive', 'cyber-dynamic-marketplace' ); ?></span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <tr>
                            <td><strong><?php esc_html_e( 'Live Products in Store', 'cyber-dynamic-marketplace' ); ?></strong></td>
                            <td><strong><?php echo intval( $product_count ); ?></strong> <?php esc_html_e( 'published products available to Marketplace app', 'cyber-dynamic-marketplace' ); ?></td>
                        </tr>
                        <tr>
                            <td><strong><?php esc_html_e( 'Categories in Store', 'cyber-dynamic-marketplace' ); ?></strong></td>
                            <td><strong><?php echo intval( $category_count ); ?></strong> <?php esc_html_e( 'categories available', 'cyber-dynamic-marketplace' ); ?></td>
                        </tr>
                        <tr>
                            <td><strong><?php esc_html_e( 'Google Gemini AI', 'cyber-dynamic-marketplace' ); ?></strong></td>
                            <td>
                                <?php if ( $has_gemini ) : ?>
                                    <span style="color:#059669;font-weight:600;">✓ <?php esc_html_e( 'Configured (Active)', 'cyber-dynamic-marketplace' ); ?></span>
                                <?php else : ?>
                                    <span style="color:#d97706;font-weight:600;">! <?php esc_html_e( 'API Key Not Set (Shopping Assistant disabled)', 'cyber-dynamic-marketplace' ); ?></span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <tr>
                            <td><strong><?php esc_html_e( 'Native REST API Endpoint', 'cyber-dynamic-marketplace' ); ?></strong></td>
                            <td><code><?php echo esc_html( rest_url( 'cdt/v1' ) ); ?></code></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <?php
    }
}
